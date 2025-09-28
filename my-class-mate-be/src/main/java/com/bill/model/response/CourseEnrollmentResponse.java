package com.bill.model.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseEnrollmentResponse {
    Long studentId;
    String studentNo;
    String studentNameTh;
    String studentNameEn;
}
