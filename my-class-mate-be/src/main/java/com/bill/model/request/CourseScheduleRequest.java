package com.bill.model.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseScheduleRequest {
    @NotNull
    LocalDate scheduleDate;
    @NotNull
    LocalTime startTime;
    @NotNull
    LocalTime endTime;
    @NotNull
    String room;
    String remark;
}
