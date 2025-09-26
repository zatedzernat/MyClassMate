package com.bill.model.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseLecturerResponse {
    Long lecturerId;
    String lecturerNameTh;
    String lecturerNameEn;
}
