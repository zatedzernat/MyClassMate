package com.bill.model.request;

import com.bill.constant.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateUserRequest {
    String nameTh;
    String surnameTh;
    String nameEn;
    String surnameEn;
    @NotBlank
    @Email(message = "Invalid email format")
    String email;
    RoleEnum role;
    // for student
    String studentNo;
}
