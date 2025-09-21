package com.bill.model.request;

import com.bill.constant.RoleEnum;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUserRequest {
    @NotBlank
    String username;
    @NotBlank
    String password;
    @NotBlank
    String nameTh;
    @NotBlank
    String surnameTh;
    @NotBlank
    String nameEn;
    @NotBlank
    String surnameEn;
    @NotBlank
    @Email(message = "Invalid email format")
    String email;
    @NotNull
    RoleEnum role;
}
