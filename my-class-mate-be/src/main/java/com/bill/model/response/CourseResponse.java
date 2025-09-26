package com.bill.model.response;

import com.bill.constant.DayEnum;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseResponse {
    Long courseId;
    String courseCode;
    String courseName;
    Integer academicYear;
    Integer semester;
    String room;
    LocalTime startTime;
    LocalTime endTime;
    DayEnum dayOfWeek;
    LocalDate startDate;
    LocalDate endDate;
    Long createdBy;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    List<CourseLecturerResponse> lecturers;
    List<CourseScheduleResponse> schedules;
}
