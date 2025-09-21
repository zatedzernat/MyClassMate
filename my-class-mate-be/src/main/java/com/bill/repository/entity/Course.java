package com.bill.repository.entity;

import com.bill.constant.DayEnum;
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
