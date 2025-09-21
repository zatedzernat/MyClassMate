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
@Table(name = "course_lecturers")
public class CourseLecturer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    Long courseId;
    Long lecturerId;
}
