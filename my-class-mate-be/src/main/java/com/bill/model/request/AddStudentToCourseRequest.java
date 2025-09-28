package com.bill.model.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddStudentToCourseRequest {
    @NotNull
    Long courseId;
    @NotNull
    List<Long> studentIds;
}
