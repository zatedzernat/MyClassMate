package com.bill.service;

import com.bill.constant.AttendanceStatusEnum;
import com.bill.model.CourseScheduleAttendanceProjection;
import com.bill.model.response.CourseEnrollmentResponse;
import com.bill.model.response.CourseResponse;
import com.bill.repository.AttendanceRepository;
import com.bill.repository.AttendanceSummaryRepository;
import com.bill.repository.CourseScheduleRepository;
import com.bill.repository.UserRepository;
import com.bill.repository.entity.Attendance;
import com.bill.repository.entity.AttendanceSummary;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static com.bill.constant.Constants.*;
import static com.bill.service.AppUtils.toThaiBuddhistDate;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class SummaryAndNotiService {
    CourseService courseService;
    EmailService emailService;
    AttendanceRepository attendanceRepository;
    UserRepository userRepository;
    CourseScheduleRepository courseScheduleRepository;
    AttendanceSummaryRepository attendanceSummaryRepository;

    @Transactional
    public void runSummary() {
        var now = LocalDateTime.now();
        var todayCourseSchedules = courseService.getTodayCourses();

        log.info("SummaryAndNotiService todayCourseSchedules size = {}", todayCourseSchedules.size());

        for (var courseSchedule : todayCourseSchedules) {
            var courseScheduleId = courseSchedule.getCourseScheduleId();
            var courseId = courseSchedule.getCourseId();
            var course = courseService.getCourse(courseId);

            for (var enrollment : course.getEnrollments()) {
                var studentId = enrollment.getStudentId();

                // current attendance
                var currentAttendances = courseScheduleRepository.findCurrentCourseScheduleAttendanceByCourseIdAndStudentId(
                        courseId,
                        studentId,
                        now.toLocalDate()
                );

                // today attendance
                var todayAttendance = currentAttendances.stream()
                        .filter(atn -> now.toLocalDate().equals(atn.getScheduleDate()))
                        .findFirst()
                        .orElseThrow();
                insertAttendanceWhenAbsent(todayAttendance, studentId, courseId, courseScheduleId, now);

                int totalPresent = countAttendanceByStatus(currentAttendances, AttendanceStatusEnum.PRESENT);
                int totalLate = countAttendanceByStatus(currentAttendances, AttendanceStatusEnum.LATE);
                int totalAbsent = countAttendanceByStatus(currentAttendances, AttendanceStatusEnum.ABSENT);

                // upsert attendance summary
                var attendanceSummary = upsertAttendanceSummary(studentId, courseId, totalPresent, totalLate, totalAbsent, now);

                // email noti
                sendNotiEmail(courseScheduleId, enrollment, studentId, course, now, todayAttendance, attendanceSummary);
            }
        }
    }

    private void insertAttendanceWhenAbsent(CourseScheduleAttendanceProjection todayAttendance, Long studentId, Long courseId, Long courseScheduleId, LocalDateTime now) {
        if (AttendanceStatusEnum.ABSENT.equals(todayAttendance.getStatus())) {
            // insert attendance for absent
            attendanceRepository.save(Attendance.builder()
                    .studentId(studentId)
                    .courseId(courseId)
                    .courseScheduleId(courseScheduleId)
                    .status(AttendanceStatusEnum.ABSENT)
                    .createdAt(now)
                    .build());
        }
    }

    private int countAttendanceByStatus(List<CourseScheduleAttendanceProjection> attendances, AttendanceStatusEnum status) {
        log.info("attendances = {}, status = {}", attendances, status);
        return (int) attendances.stream()
                .filter(atd -> status.equals(atd.getStatus()))
                .count();
    }

    private AttendanceSummary upsertAttendanceSummary(Long studentId, Long courseId, int totalPresent, int totalLate, int totalAbsent, LocalDateTime now) {
        var attendanceSummary = attendanceSummaryRepository.findByStudentIdAndCourseId(studentId, courseId);
        if (attendanceSummary == null) {
            // case 1: insert (first time)
            var newSummary = AttendanceSummary.builder()
                    .studentId(studentId)
                    .courseId(courseId)
                    .totalPresent(totalPresent)
                    .totalLate(totalLate)
                    .totalAbsent(totalAbsent)
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            attendanceSummary = attendanceSummaryRepository.save(newSummary);
            log.info("Inserted summary for studentId={}, courseId={}", studentId, courseId);
        } else {
            // case 2: update
            attendanceSummary.setTotalPresent(totalPresent);
            attendanceSummary.setTotalLate(totalLate);
            attendanceSummary.setTotalAbsent(totalAbsent);
            attendanceSummary.setUpdatedAt(now);

            attendanceSummary = attendanceSummaryRepository.save(attendanceSummary);
            log.info("Updated summary for attendanceSummaryId={} studentId={}, courseId={}", attendanceSummary.getId(), studentId, courseId);
        }
        return attendanceSummary;
    }

    private void sendNotiEmail(Long courseScheduleId, CourseEnrollmentResponse enrollment, Long studentId, CourseResponse course, LocalDateTime now, CourseScheduleAttendanceProjection todayAttendance, AttendanceSummary attendanceSummary) {
        var studentEmail = userRepository.findById(studentId).orElseThrow().getEmail();
        if (StringUtils.isNotBlank(studentEmail)) {
            var buddhistDate = toThaiBuddhistDate(now.toLocalDate());
            var subject = String.format(EMAIL_SUBJECT_TEMPLATE, course.getCourseCode(), buddhistDate);

            // set today status color

            var todayStatusText = todayAttendance.getStatus().getDesc();
            var todayStatusColor = getStatusColor(todayAttendance);

            // set today participation
            var todayParticipation = courseScheduleRepository.findTotalParticipationsByStudentIdAndCourseScheduleId(studentId, courseScheduleId);

            // set absent percentage
            var totalCourseSchedule = course.getSchedules().size();
            var absentPercent = (attendanceSummary.getTotalAbsent() * 100.0 / totalCourseSchedule);
            var absentNote = String.format(ABSENT_NOTE_TEMPLATE, absentPercent);

            var body = String.format(EMAIL_BODY_TEMPLATE,
                    enrollment.getStudentNameTh(),
                    course.getCourseCode(),
                    buddhistDate,
                    course.getCourseCode().concat("-").concat(course.getCourseName()),
                    todayStatusColor,
                    todayStatusText,
                    todayParticipation.getTotalParticipations(), // จำนวนครั้งมีส่วนร่วม
                    todayParticipation.getTotalScore(), // คะแนนที่ได้รับ
                    totalCourseSchedule,
                    attendanceSummary.getTotalPresent(),
                    attendanceSummary.getTotalLate(),
                    attendanceSummary.getTotalAbsent(),
                    absentNote
            );

            emailService.sendEmail(studentEmail, subject, body);
        }
    }

    private String getStatusColor(CourseScheduleAttendanceProjection todayAttendance) {
        String statusColor = "";
        switch (todayAttendance.getStatus()) {
            case PRESENT -> statusColor = "green";
            case LATE -> statusColor = "orange";
            case ABSENT -> statusColor = "red";
        }
        return statusColor;
    }

}
