package com.bill.service;

import com.bill.constant.RoleEnum;
import com.bill.exceptionhandler.AppException;
import com.bill.model.request.*;
import com.bill.model.response.*;
import com.bill.repository.*;
import com.bill.repository.entity.Course;
import com.bill.repository.entity.CourseLecturer;
import com.bill.repository.entity.CourseSchedule;
import com.bill.repository.entity.Enrollment;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static com.bill.exceptionhandler.ErrorEnum.*;
import static com.bill.service.AppUtils.getCellValue;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class CourseService {
    ModelMapper modelMapper;
    UserService userService;
    StudentProfileService studentProfileService;
    CourseRepository courseRepository;
    CourseScheduleRepository courseScheduleRepository;
    CourseLecturerRepository courseLecturerRepository;
    EnrollmentRepository enrollmentRepository;
    CourseJdbcRepository courseJdbcRepository;
    AttendanceRepository attendanceRepository;
    AttendanceSummaryRepository attendanceSummaryRepository;
    ParticipationRepository participationRepository;

    public List<InitCourseResponse> initCourse(InitCourseRequest request) {
        var dayOfWeek = request.getDayOfWeek();
        var startDate = request.getStartDate();
        var endDate = request.getEndDate();
        var startTime = request.getStartTime();
        var endTime = request.getEndTime();

        if ((endDate.isBefore(startDate) || endDate.isEqual(startDate)) ||
                (endTime.isBefore(startTime) || endTime.equals(startTime))) {
            throw new AppException(ERROR_INVALID_END_DATE.getCode(), ERROR_INVALID_END_DATE.getMessage());
        }

        List<InitCourseResponse> responses = new ArrayList<>();

        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek().equals(DayOfWeek.valueOf(dayOfWeek.name()))) {
                responses.add(InitCourseResponse.builder()
                        .scheduleDate(current)
                        .startTime(startTime)
                        .endTime(endTime)
                        .room(request.getRoom())
                        .build());
            }
            current = current.plusDays(1);
        }

        return responses;
    }

    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        checkDupCourse(request.getCourseCode(), request.getCourseName());

        var now = LocalDateTime.now();
        var newCourse = modelMapper.map(request, Course.class);
        newCourse.setCreatedAt(now);
        newCourse.setUpdatedAt(now);
        newCourse = courseRepository.save(newCourse);

        var courseId = newCourse.getId();
        insertCourseLecturer(request.getLecturerIds(), courseId);
        insertCourseSchedule(request.getSchedules(), courseId, now);

        return mapToCourseResponse(newCourse);
    }

    private void checkDupCourse(String courseCode, String courseName) {
        var findDupCourseCode = courseRepository.findByCourseCode(courseCode);
        var findDupCourseName = courseRepository.findByCourseName(courseName);

        if (findDupCourseCode.isPresent() || findDupCourseName.isPresent()) {
            throw new AppException(ERROR_DUPLICATE_COURSE.getCode(), ERROR_DUPLICATE_COURSE.getMessage());
        }
    }

    private void insertCourseLecturer(List<Long> lecturerIds, Long courseId) {
        var courseLecturers = new ArrayList<CourseLecturer>();
        for (var lecturerId : lecturerIds) {
            var user = userService.getUser(lecturerId, false);
            if (!RoleEnum.LECTURER.equals(user.getRole())) {
                log.error("error insertCourseLecturer lecturerId = {}", lecturerId);
                throw new AppException(ERROR_INVALID_ROLE_FOR_LECTURER_ID.getCode(), ERROR_INVALID_ROLE_FOR_LECTURER_ID.getMessage());
            }

            var newCourseLecturer = CourseLecturer.builder()
                    .courseId(courseId)
                    .lecturerId(lecturerId)
                    .build();
            courseLecturers.add(newCourseLecturer);
        }
        courseLecturerRepository.saveAll(courseLecturers);
    }

    private void insertCourseSchedule(List<CourseScheduleRequest> schedules, Long courseId, LocalDateTime now) {
        var courseSchedules = new ArrayList<CourseSchedule>();
        for (var schedule : schedules) {
            var newCourseSchedule = modelMapper.map(schedule, CourseSchedule.class);
            newCourseSchedule.setCourseId(courseId);
            newCourseSchedule.setCreatedAt(now);
            newCourseSchedule.setUpdatedAt(now);
            courseSchedules.add(newCourseSchedule);
        }
        courseScheduleRepository.saveAll(courseSchedules);
    }

    public CourseResponse getCourse(Long courseId) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ERROR_COURSE_NOT_FOUND.getCode(), ERROR_COURSE_NOT_FOUND.getMessage()));

        return mapToCourseResponse(course);
    }

    public List<CourseResponse> getCourses(Integer academicYear, Integer semester) {
        var courses = courseJdbcRepository.findCourses(academicYear, semester);
        courses.sort(Comparator.comparing(Course::getCourseCode));
        return mapToCoursesResponse(courses);
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        courseRepository.deleteById(courseId);
        courseScheduleRepository.deleteByCourseId(courseId);
        courseLecturerRepository.deleteByCourseId(courseId);
        enrollmentRepository.deleteByCourseId(courseId);
        attendanceRepository.deleteByCourseId(courseId);
        attendanceSummaryRepository.deleteByCourseId(courseId);
    }

    @Transactional
    public CourseResponse updateCourse(Long courseId, UpdateCourseRequest request) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ERROR_COURSE_NOT_FOUND.getCode(), ERROR_COURSE_NOT_FOUND.getMessage()));
        var now = LocalDateTime.now();
        course.setCourseCode(request.getCourseCode());
        course.setCourseName(request.getCourseName());
        course.setAcademicYear(request.getAcademicYear());
        course.setSemester(request.getSemester());
        course.setRoom(request.getRoom());
        course.setUpdatedAt(now);
        courseRepository.save(course);

        // delete course lecturer
        courseLecturerRepository.deleteByCourseId(courseId);
        insertCourseLecturer(request.getLecturerIds(), courseId);

        // update course schedule
        updateCourseSchedule(request.getSchedules(), courseId, now);

        return mapToCourseResponse(course);
    }

    private void updateCourseSchedule(List<CourseScheduleRequest> schedules, Long courseId, LocalDateTime now) {
        var courseSchedules = new ArrayList<CourseSchedule>();
        for (var schedule : schedules) {
            var courseScheduleId = schedule.getCourseScheduleId();
            var existingSchedule = courseScheduleRepository.findById(courseScheduleId)
                    .orElseThrow(() -> new AppException(ERROR_SCHEDULE_NOT_FOUND.getCode(), ERROR_SCHEDULE_NOT_FOUND.getMessage()));

            if (Boolean.TRUE.equals(schedule.getIsDeleted())) {
                courseScheduleRepository.deleteById(courseScheduleId);
                attendanceRepository.deleteByCourseScheduleId(courseScheduleId);
                participationRepository.deleteByCourseScheduleId(courseScheduleId);
            } else {
                existingSchedule.setCourseId(courseId);
                existingSchedule.setScheduleDate(schedule.getScheduleDate());
                existingSchedule.setStartTime(schedule.getStartTime());
                existingSchedule.setEndTime(schedule.getEndTime());
                existingSchedule.setRoom(schedule.getRoom());
                existingSchedule.setRemark(schedule.getRemark());
                existingSchedule.setUpdatedAt(now);

                courseSchedules.add(existingSchedule);
            }
        }

        courseScheduleRepository.saveAll(courseSchedules);
    }

    @Transactional
    public CourseResponse addStudentToCourse(Long courseId, AddStudentToCourseRequest request) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ERROR_COURSE_NOT_FOUND.getCode(), ERROR_COURSE_NOT_FOUND.getMessage()));
        var now = LocalDateTime.now();
        var studentIds = request.getStudentIds().stream().distinct().toList();

        var enrollments = new ArrayList<Enrollment>();
        for (var studentId : studentIds) {
            studentProfileService.validateStudent(studentId);
            var enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId);
            if (enrollment.isEmpty()) {
                var newEnrollment = Enrollment.builder()
                        .courseId(courseId)
                        .studentId(studentId)
                        .createdAt(now)
                        .build();
                enrollments.add(newEnrollment);
            }
        }

        enrollmentRepository.saveAll(enrollments);

        return mapToCourseResponse(course);
    }

    public byte[] exportStudentToCourse(Long courseId, Boolean isTemplate) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("ผู้เรียน");

            // ---------- Header Style ----------
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 18);
            headerFont.setColor(IndexedColors.BLACK.getIndex());

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // ---------- Data Style ----------
            CellStyle dataStyle = workbook.createCellStyle();
            Font dataFont = workbook.createFont();
            dataFont.setFontHeightInPoints((short) 16);
            dataStyle.setFont(dataFont);

            // Header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"รหัสนักศึกษา"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            if (!Boolean.TRUE.equals(isTemplate)) {
                var enrollments = enrollmentRepository.findByCourseIdOrderByCreatedAtAsc(courseId);
                int rowIdx = 1;

                for (var enrollment : enrollments) {
                    var studentId = enrollment.getStudentId();
                    var studentProfile = studentProfileService.getStudentProfile(studentId);
                    String studentNo = studentProfile.getStudentNo();

                    Row row = sheet.createRow(rowIdx++);
                    row.createCell(0).setCellValue(studentNo);
                    row.getCell(0).setCellStyle(dataStyle);
                }
            }

            // Auto size
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, (int) (currentWidth * 1.3));
            }

            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            log.error("cannot export excel", e);
            throw new AppException(ERROR_EXPORT_EXCEL.getCode(), ERROR_EXPORT_EXCEL.getMessage());
        }
    }

    @Transactional
    public ImportStudentToCourseExcelResponse importStudentToCourse(Long courseId, MultipartFile file) {
        List<String> invalidStudentNos = new ArrayList<>();
        int createdRow = 0;
        var now = LocalDateTime.now();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);

            for (int rowIdx = 1; rowIdx <= sheet.getLastRowNum(); rowIdx++) {
                Row row = sheet.getRow(rowIdx);
                if (row == null) continue;

                Cell cell = row.getCell(0);
                if (cell == null) continue;

                String studentNo = getCellValue(cell);
                if (studentNo.isEmpty()) continue;

                // check student exist?
                var studentProfile = studentProfileService.getStudentProfile(studentNo).orElse(null);
                if (studentProfile == null) {
                    invalidStudentNos.add(studentNo);
                    continue;
                }

                Long studentId = studentProfile.getStudentId();
                var enrollments = new ArrayList<Enrollment>();
                var enrollment = enrollmentRepository.findByStudentIdAndCourseId(studentId, courseId);
                // insert if empty or not enroll yet
                if (enrollment.isEmpty()) {
                    var newEnrollment = Enrollment.builder()
                            .studentId(studentId)
                            .courseId(courseId)
                            .createdAt(now)
                            .build();
                    enrollments.add(newEnrollment);
                    createdRow++;
                }

                enrollmentRepository.saveAll(enrollments);
            }
        } catch (Exception e) {
            log.error("cannot import excel", e);
            throw new AppException(ERROR_IMPORT_EXCEL.getCode(), ERROR_IMPORT_EXCEL.getMessage());
        }

        return ImportStudentToCourseExcelResponse.builder().createdRow(createdRow).invalidStudentNos(invalidStudentNos).build();
    }

    public List<TodayCourseResponse> getTodayCourses() {
        var responses = new ArrayList<TodayCourseResponse>();
        var schedules = courseScheduleRepository.findByScheduleDateOrderByStartTimeAsc(LocalDate.now());
        for (var schedule : schedules) {
            var course = courseRepository.findById(schedule.getCourseId())
                    .orElseThrow(() -> new AppException(ERROR_COURSE_NOT_FOUND.getCode(), ERROR_COURSE_NOT_FOUND.getMessage()));
            var response = modelMapper.map(schedule, TodayCourseResponse.class);
            response.setCourseScheduleId(schedule.getId());
            response.setCourseId(course.getId());
            response.setCourseCode(course.getCourseCode());
            response.setCourseName(course.getCourseName());
            responses.add(response);
        }

        responses.sort(Comparator.comparing(TodayCourseResponse::getScheduleDate).thenComparing(TodayCourseResponse::getCourseCode));
        return responses;
    }

    private CourseResponse mapToCourseResponse(Course course) {
        var courseResponse = modelMapper.map(course, CourseResponse.class);
        var courseId = course.getId();
        courseResponse.setCourseId(courseId);

        // course lecturer
        var clResponses = new ArrayList<CourseLecturerResponse>();
        var courseLecturers = courseLecturerRepository.findByCourseId(courseId);
        for (var courseLecturer : courseLecturers) {
            var clResponse = modelMapper.map(courseLecturer, CourseLecturerResponse.class);
            var lecturerId = courseLecturer.getLecturerId();
            clResponse.setLecturerId(lecturerId);
            var userNameDto = userService.getFullName(lecturerId);
            clResponse.setLecturerNameTh(userNameDto.getFullNameTh());
            clResponse.setLecturerNameEn(userNameDto.getFullNameEn());
            clResponses.add(clResponse);
        }
        courseResponse.setLecturers(clResponses);

        // course schedule
        var csResponses = new ArrayList<CourseScheduleResponse>();
        var courseSchedules = courseScheduleRepository.findByCourseIdOrderByScheduleDateAsc(courseId);
        for (var cs : courseSchedules) {
            var csResponse = modelMapper.map(cs, CourseScheduleResponse.class);
            csResponse.setCourseScheduleId(cs.getId());
            csResponses.add(csResponse);
        }
        courseResponse.setSchedules(csResponses);

        // course enrollment
        var enResponses = new ArrayList<CourseEnrollmentResponse>();
        var enrollments = enrollmentRepository.findByCourseIdOrderByCreatedAtAsc(courseId);
        for (var en : enrollments) {
            var enResponse = modelMapper.map(en, CourseEnrollmentResponse.class);
            var studentProfile = studentProfileService.getStudentProfile(en.getStudentId());
            enResponse.setStudentNo(studentProfile.getStudentNo());
            enResponse.setStudentNameTh(studentProfile.getStudentNameTh());
            enResponse.setStudentNameEn(studentProfile.getStudentNameEn());
            enResponses.add(enResponse);
        }
        enResponses.sort(Comparator.comparing(CourseEnrollmentResponse::getStudentNo));
        courseResponse.setEnrollments(enResponses);

        return courseResponse;
    }

    private List<CourseResponse> mapToCoursesResponse(List<Course> courses) {
        var responseList = new ArrayList<CourseResponse>();
        for (var course : courses) {
            var courseResponse = mapToCourseResponse(course);
            responseList.add(courseResponse);
        }
        return responseList;
    }

}
