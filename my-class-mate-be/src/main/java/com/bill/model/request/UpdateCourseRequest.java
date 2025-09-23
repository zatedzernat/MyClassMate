package com.bill.model.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateCourseRequest {
    String courseCode;
    String courseName;
    Integer academicYear;
    Integer semester;
    String room;
    @NotNull
    List<@Valid CourseScheduleRequest> schedules;
}
