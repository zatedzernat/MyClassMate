package com.bill.model.request;

import com.bill.constant.DayEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

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
    @NotBlank
    String room;
}
