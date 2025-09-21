package com.bill.repository.entity;

import com.bill.constant.DayEnum;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

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
