package com.bill.service;

import com.bill.model.CourseScheduleAttendanceProjection;
import com.bill.model.response.CourseScheduleForReportResponse;
import com.bill.model.response.ReportResponse;
import com.bill.repository.CourseScheduleRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(makeFinal = true, level = AccessLevel.PRIVATE)
public class ReportService {
    ModelMapper modelMapper;
    CourseService courseService;
    CourseScheduleRepository courseScheduleRepository;

    public ReportResponse getReports(Long courseId, Long studentId) {
        var response = new ReportResponse();
        response.setCourseId(courseId);

        var course = courseService.getCourse(courseId);
        var schedules = course.getSchedules();

        // key = courseScheduleId, value = List
        var scheduleAttendanceMap = courseScheduleRepository.findCourseScheduleAttendanceByCourseId(courseId)
                .stream()
                .collect(Collectors.groupingBy(CourseScheduleAttendanceProjection::getCourseScheduleId));

        var schedulesResponse = new ArrayList<CourseScheduleForReportResponse>();

        for (var schedule : schedules) {
            // get all schedules, enrollments and attendances
            var courseScheduleId = schedule.getCourseScheduleId();
            var attendances = scheduleAttendanceMap.get(courseScheduleId);
            if (attendances != null) {
                var scheduleResponse = modelMapper.map(schedule, CourseScheduleForReportResponse.class);

                scheduleResponse.setAttendances(attendances.stream()
                        .map(attendance ->
                                CourseScheduleForReportResponse.AttendanceForReport.builder()
                                        .studentId(attendance.getStudentId())
                                        .studentNo(attendance.getStudentNo())
                                        .studentNameEn(attendance.getStudentNameEn())
                                        .studentNameTh(attendance.getStudentNameEn())
                                        .status(attendance.getStatus())
                                        .statusDesc(attendance.getStatus().getDesc())
                                        .build())
                        .toList());

                schedulesResponse.add(scheduleResponse);
            }

            // todo: get all participations
        }

        response.setSchedules(schedulesResponse);

        return response;
    }

    public void exportReports(Long courseId, Long studentId) {

    }
}
