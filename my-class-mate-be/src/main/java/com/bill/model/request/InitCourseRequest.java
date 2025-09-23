package com.bill.model.request;

import com.bill.constant.DayEnum;
import jakarta.validation.constraints.NotBlank;
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
public class InitCourseRequest {
    @NotNull
    DayEnum dayOfWeek;
    @NotNull
    LocalDate startDate;
    @NotNull
    LocalDate endDate;
    @NotNull
    LocalTime startTime;
    @NotNull
    LocalTime endTime;
    @NotBlank
    String room;
}
