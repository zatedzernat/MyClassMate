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
        name = "enrollments",
        indexes = {
                @Index(name = "enrollments_index_0", columnList = "student_id"),
                @Index(name = "enrollments_index_1", columnList = "course_id")
        })
public class Enrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "student_id", nullable = false)
    Long studentId;

    @Column(name = "course_id", nullable = false)
    Long courseId;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;
}
