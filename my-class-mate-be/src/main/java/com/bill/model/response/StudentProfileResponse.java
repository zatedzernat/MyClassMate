package com.bill.model.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentProfileResponse {
    Long studentId;
    String studentNo;
    String address;
    String phoneNumber;
    String remark;
}
