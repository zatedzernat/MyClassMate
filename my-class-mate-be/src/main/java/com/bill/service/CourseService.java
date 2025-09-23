package com.bill.service;

import com.bill.exceptionhandler.AppException;
import com.bill.model.request.CourseScheduleRequest;
import com.bill.model.request.CreateCourseRequest;
import com.bill.model.request.InitCourseRequest;
import com.bill.model.request.UpdateCourseRequest;
import com.bill.model.response.CourseResponse;
import com.bill.model.response.CourseScheduleResponse;
import com.bill.model.response.InitCourseResponse;
import com.bill.repository.CourseJdbcRepository;
import com.bill.repository.CourseRepository;
import com.bill.repository.CourseScheduleRepository;
import com.bill.repository.entity.Course;
import com.bill.repository.entity.CourseSchedule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.bill.exceptionhandler.ErrorEnum.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {
    private final ModelMapper modelMapper;
    private final CourseRepository courseRepository;
    private final CourseScheduleRepository courseScheduleRepository;
    private final CourseJdbcRepository courseJdbcRepository;

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

        insertCourseSchedule(request.getSchedules(), newCourse.getId(), now);

        return mapToCourseResponse(newCourse);
    }

    private void checkDupCourse(String courseCode, String courseName) {
        var findDupCourseCode = courseRepository.findByCourseCode(courseCode);
        var findDupCourseName = courseRepository.findByCourseName(courseName);

        if (findDupCourseCode.isPresent() || findDupCourseName.isPresent()) {
            throw new AppException(ERROR_DUPLICATE_COURSE.getCode(), ERROR_DUPLICATE_COURSE.getMessage());
        }
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

        return mapToCoursesResponse(courses);
    }

    @Transactional
    public void deleteCourse(Long courseId) {
        courseRepository.deleteById(courseId);
        courseScheduleRepository.deleteByCourseId(courseId);
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

        courseScheduleRepository.deleteByCourseId(courseId);
        insertCourseSchedule(request.getSchedules(), courseId, now);

        return mapToCourseResponse(course);
    }

    private CourseResponse mapToCourseResponse(Course course) {
        var courseResponse = modelMapper.map(course, CourseResponse.class);
        courseResponse.setCourseId(course.getId());

        var courseSchedules = courseScheduleRepository.findByCourseId(course.getId());

        var csResponses = new ArrayList<CourseScheduleResponse>();
        for (var cs : courseSchedules) {
            var csResponse = modelMapper.map(cs, CourseScheduleResponse.class);
            csResponse.setCourseScheduleId(cs.getId());
            csResponses.add(csResponse);
        }

        courseResponse.setSchedules(csResponses);
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
