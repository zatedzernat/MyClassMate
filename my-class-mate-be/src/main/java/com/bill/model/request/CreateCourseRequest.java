package com.bill.model.request;

import com.bill.constant.DayEnum;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateCourseRequest {
    @NotBlank
    String courseCode;
    @NotBlank
    String courseName;
    @NotNull
    Integer academicYear;
    @NotNull
    Integer semester;
    @NotBlank
    String room;
    @NotNull
    LocalTime startTime;
    @NotNull
    LocalTime endTime;
    @NotNull
    DayEnum dayOfWeek; // MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
    @NotNull
    LocalDate startDate;
    @NotNull
    LocalDate endDate;
    @NotNull
    Long createdBy;
    @NotNull
    List<Long> lecturerIds;
    @NotNull
    List<@Valid CourseScheduleRequest> schedules;
}
