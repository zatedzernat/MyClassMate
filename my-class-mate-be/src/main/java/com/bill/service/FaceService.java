package com.bill.service;

import com.bill.constant.AttendanceStatusEnum;
import com.bill.exceptionhandler.AppException;
import com.bill.model.response.AttendanceResponse;
import com.bill.model.response.FaceRegisterResponse;
import com.bill.model.response.FastAPIFaceRegResponse;
import com.bill.model.response.FastAPIFaceRegisterResponse;
import com.bill.repository.AttendanceRepository;
import com.bill.repository.CourseRepository;
import com.bill.repository.CourseScheduleRepository;
import com.bill.repository.EnrollmentRepository;
import com.bill.repository.entity.Attendance;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import static com.bill.exceptionhandler.ErrorEnum.*;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class FaceService {
    ApiClient apiClient;
    UserService userService;
    StudentProfileService studentProfileService;
    EnrollmentRepository enrollmentRepository;
    AttendanceRepository attendanceRepository;
    CourseRepository courseRepository;
    CourseScheduleRepository courseScheduleRepository;

    public FaceRegisterResponse faceRegister(Long userId, List<MultipartFile> files) {
        var imageCount = 0;
        var user = userService.getUser(userId, false);

        var faceRegisterEndpoint = "/v1/face-register";
        var response = apiClient.postMultipartSafe(faceRegisterEndpoint, userId, files, FastAPIFaceRegisterResponse.class, "files");


        if ("Success".equals(response.getStatus())) {
            imageCount = response.getNumFacesRegistered();
        }

        return FaceRegisterResponse.builder()
                .userId(user.getUserId())
                .imageCount(imageCount)
                .build();
    }

    @Transactional
    public AttendanceResponse attendance(Long courseId, Long courseScheduleId, MultipartFile file) {
        var faceRegEndpoint = "/v1/face-recognition";
        var fastApiResponse = apiClient.postMultipartSafe(faceRegEndpoint, null, List.of(file), FastAPIFaceRegResponse.class, "file");

        if ("Success".equals(fastApiResponse.getStatus())) {
            log.info("attendance fast-api courseId = {}, courseScheduleId = {}, fastApiResponse = {}", courseId, courseScheduleId, fastApiResponse);
            var studentId = fastApiResponse.getUserId();
            var studentProfile = studentProfileService.getStudentProfile(studentId);
            // validate student enrollment
            enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId)
                    .orElseThrow(() -> new AppException(
                            ERROR_ENROLLMENT_NOT_FOUND.getCode(),
                            ERROR_ENROLLMENT_NOT_FOUND.format(studentProfile.getStudentNo()))
                    );

            var schedule = courseScheduleRepository.findById(courseScheduleId)
                    .orElseThrow(() -> new AppException(
                            ERROR_SCHEDULE_NOT_FOUND.getCode(),
                            ERROR_SCHEDULE_NOT_FOUND.format(courseScheduleId)
                    ));

            // check status
            var now = LocalDateTime.now();
            var status = AttendanceStatusEnum.PRESENT;

            int lateThresholdMinutes = 15;
            LocalTime lateLimit = schedule.getStartTime().plusMinutes(lateThresholdMinutes);

            if (now.toLocalTime().isAfter(lateLimit)) {
                status = AttendanceStatusEnum.LATE;
            }

            var attendance = attendanceRepository.findFirstByStudentIdAndCourseScheduleIdOrderByIdDesc(studentId, courseScheduleId);

            // insert only first time attendance
            if (attendance == null) {
                attendance = Attendance.builder()
                        .studentId(studentId)
                        .courseId(courseId)
                        .courseScheduleId(courseScheduleId)
                        .createdAt(now)
                        .status(status)
                        .build();
                attendance = attendanceRepository.save(attendance);
            }

            var course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new AppException(ERROR_COURSE_NOT_FOUND.getCode(), ERROR_COURSE_NOT_FOUND.getMessage()));


            var response =  AttendanceResponse.builder()
                    .attendanceId(attendance.getId())
                    .studentId(studentId)
                    .studentNo(studentProfile.getStudentNo())
                    .studentNameTh(studentProfile.getStudentNameTh())
                    .studentNameEn(studentProfile.getStudentNameEn())
                    .courseId(courseId)
                    .courseScheduleId(courseScheduleId)
                    .courseCode(course.getCourseCode())
                    .createdAt(now)
                    .status(status)
                    .statusDesc(status.getDesc())
                    .build();
            log.info("attendance response = {}", response);
            return response;
        } else {
            throw new AppException(ERROR_INTERNAL_API_CALL.getCode(), ERROR_INTERNAL_API_CALL.getMessage());
        }
    }

}
