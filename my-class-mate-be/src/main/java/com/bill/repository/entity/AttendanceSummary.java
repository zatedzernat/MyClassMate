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
@Table(
        name = "attendance_summaries",
        indexes = {
                @Index(name = "attendance_summaries_index_0", columnList = "student_id"),
                @Index(name = "attendance_summaries_index_1", columnList = "course_id")
        })
public class AttendanceSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "student_id", nullable = false)
    Long studentId;

    @Column(name = "course_id", nullable = false)
    Long courseId;

    @Column(name = "total_present", nullable = false)
    Integer totalPresent;

    @Column(name = "total_late", nullable = false)
    Integer totalLate;

    @Column(name = "total_absent", nullable = false)
    Integer totalAbsent;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;
}
