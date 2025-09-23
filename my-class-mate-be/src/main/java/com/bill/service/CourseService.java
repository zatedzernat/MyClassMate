package com.bill.service;

import com.bill.exceptionhandler.AppException;
import com.bill.model.request.CreateCourseRequest;
import com.bill.model.request.InitCourseRequest;
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
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static com.bill.exceptionhandler.ErrorEnum.ERROR_DUPLICATE_COURSE;
import static com.bill.exceptionhandler.ErrorEnum.ERROR_INVALID_END_DATE;

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

        if (endDate.isBefore(startDate) || endDate.isEqual(startDate)) {
            throw new AppException(ERROR_INVALID_END_DATE.getCode(), ERROR_INVALID_END_DATE.getMessage());
        }

        List<InitCourseResponse> responses = new ArrayList<>();

        // default
        LocalTime defaultStart = LocalTime.of(9, 0);
        LocalTime defaultEnd = LocalTime.of(12, 0);

        LocalDate current = startDate;
        while (!current.isAfter(endDate)) {
            if (current.getDayOfWeek().equals(DayOfWeek.valueOf(dayOfWeek.name()))) {
                responses.add(InitCourseResponse.builder()
                        .scheduleDate(current)
                        .startTime(defaultStart)
                        .endTime(defaultEnd)
                        .room(request.getRoom())
                        .build());
            }
            current = current.plusDays(1);
        }

        return responses;
    }

    @Transactional
    public CourseResponse createCourse(CreateCourseRequest request) {
        var findDupCourseCode = courseRepository.findByCourseCode(request.getCourseCode());
        var findDupCourseName = courseRepository.findByCourseName(request.getCourseName());

        if (findDupCourseCode.isPresent() || findDupCourseName.isPresent()) {
            throw new AppException(ERROR_DUPLICATE_COURSE.getCode(), ERROR_DUPLICATE_COURSE.getMessage());
        }

        var now = LocalDateTime.now();
        var newCourse = modelMapper.map(request, Course.class);
        newCourse.setCreatedAt(now);
        newCourse.setUpdatedAt(now);
        newCourse = courseRepository.save(newCourse);

        var courseSchedules = new ArrayList<CourseSchedule>();
        for (var schedule : request.getSchedules()) {
            var newCourseSchedule = modelMapper.map(schedule, CourseSchedule.class);
            newCourseSchedule.setCourseId(newCourse.getId());
            newCourseSchedule.setCreatedAt(now);
            newCourseSchedule.setUpdatedAt(now);
            courseSchedules.add(newCourseSchedule);
        }
        courseScheduleRepository.saveAll(courseSchedules);

        return mapToCourseResponse(newCourse);
    }

    public List<CourseResponse> getCourses(Integer academicYear, Integer semester) {
        var courses = courseJdbcRepository.findCourses(academicYear, semester);

        return mapToCoursesResponse(courses);
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
