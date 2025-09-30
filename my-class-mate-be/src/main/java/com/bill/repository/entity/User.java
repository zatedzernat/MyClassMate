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
@Table(
        name = "users",
        indexes = {
                @Index(name = "users_index_0", columnList = "username"),
                @Index(name = "users_index_1", columnList = "email"),
                @Index(name = "users_index_2", columnList = "role")
        })
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "username", length = 50, unique = true, nullable = false)
    String username;

    @Column(name = "password", length = 255, nullable = false)
    String password;

    @Column(name = "name_th", length = 100, nullable = false)
    String nameTh;

    @Column(name = "surname_th", length = 100, nullable = false)
    String surnameTh;

    @Column(name = "name_en", length = 100, nullable = false)
    String nameEn;

    @Column(name = "surname_en",  length = 100, nullable = false)
    String surnameEn;

    @Column(name = "email", length = 100, unique = true)
    String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 10, nullable = false)
    RoleEnum role;

    @Column(name = "is_deleted", nullable = false)
    Boolean isDeleted;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;
}
