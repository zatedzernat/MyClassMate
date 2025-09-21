package com.bill.repository.entity;

import com.bill.constant.RoleEnum;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "student_profiles")
public class StudentProfile {
    @Id
    Long studentId;
    String address;
    String phoneNumber;
    String remark;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
