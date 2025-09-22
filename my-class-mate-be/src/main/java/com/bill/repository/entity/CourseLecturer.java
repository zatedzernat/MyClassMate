package com.bill.repository.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(
        name = "course_lecturers",
        indexes = {
                @Index(name = "course_lecturers_index_0", columnList = "course_id"),
                @Index(name = "course_lecturers_index_1", columnList = "lecturer_id")
        })
public class CourseLecturer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "course_id", nullable = false)
    Long courseId;

    @Column(name = "lecturer_id", nullable = false)
    Long lecturerId;
}
