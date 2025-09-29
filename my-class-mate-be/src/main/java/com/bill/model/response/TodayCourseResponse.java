package com.bill.model.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TodayCourseResponse {
    Long courseScheduleId;
    Long courseId;
    String courseCode;
    String courseName;
    LocalDate scheduleDate;
    LocalTime startTime;
    LocalTime endTime;
    String room;
    String remark;
}
