package com.bill.model;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentProfileDto {
    String studentNo;
    String address;
    String phoneNumber;
    String remark;
}
