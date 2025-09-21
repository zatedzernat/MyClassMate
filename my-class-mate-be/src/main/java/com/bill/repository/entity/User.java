package com.bill.repository.entity;

import com.bill.constant.RoleEnum;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String username;
    String password;
    String nameTh;
    String surnameTh;
    String nameEn;
    String surnameEn;
    String email;
    @Enumerated(EnumType.STRING)
    RoleEnum role;
    Boolean isDeleted;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
