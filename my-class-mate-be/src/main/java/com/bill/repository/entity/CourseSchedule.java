package com.bill.repository.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "course_schedules")
public class CourseSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    Long courseId;
    LocalDate scheduleDate;
    LocalTime startTime;
    LocalTime endTime;
    String room;
    String remark;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
