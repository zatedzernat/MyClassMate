package com.bill.repository.entity;

import jakarta.persistence.Column;
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

    @Column(name = "student_no", length = 50, unique = true, nullable = false)
    String studentNo;

    @Column(name = "address", length = 255, nullable = true)
    String address;

    @Column(name = "phone_number", length = 10, nullable = true)
    String phoneNumber;

    @Column(name = "remark", length = 255, nullable = true)
    String remark;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;
}
