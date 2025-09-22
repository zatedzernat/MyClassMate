package com.bill.model.response;

import com.bill.constant.RoleEnum;
import com.bill.model.StudentProfileDto;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long userId;
    String username;
    String nameTh;
    String surnameTh;
    String nameEn;
    String surnameEn;
    String email;
    RoleEnum role;
    Boolean isDeleted;
    StudentProfileDto studentProfile;
}
