package com.bill.model;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserNameDto {
    String fullNameTh;
    String fullNameEn;
}
