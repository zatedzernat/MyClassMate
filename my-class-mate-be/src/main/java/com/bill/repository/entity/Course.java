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
@Table(name = "courses")
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    String courseCode;
    String courseName;
    Integer academicYear;
    Integer semester;
    String room;
    LocalTime startTime;
    LocalTime endTime;
    @Enumerated(EnumType.STRING)
    DayEnum dayOfWeek;
    LocalDate startDate;
    LocalDate endDate;
    Long createdBy;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
