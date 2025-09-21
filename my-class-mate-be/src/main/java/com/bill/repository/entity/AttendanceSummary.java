package com.bill.repository.entity;

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
@Table(name = "attendance_summaries")
public class AttendanceSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    Long studentId;
    Long courseId;
    Integer totalPresent;
    Integer totalLate;
    Integer totalAbsent;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
