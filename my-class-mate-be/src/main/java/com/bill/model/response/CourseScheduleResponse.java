package com.bill.model.response;

import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseScheduleResponse {
    Long courseScheduleId;
    Long courseId;
    LocalDate scheduleDate;
    LocalTime startTime;
    LocalTime endTime;
    String room;
    String remark;
}
