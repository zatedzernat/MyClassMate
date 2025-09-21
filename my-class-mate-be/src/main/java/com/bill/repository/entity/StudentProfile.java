package com.bill.repository.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
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
