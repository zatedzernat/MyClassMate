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
public class InitCourseResponse {
    LocalDate scheduleDate;
    LocalTime startTime;
    LocalTime endTime;
    String room;
}
