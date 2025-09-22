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
@Table(
        name = "courses",
        indexes = {
                @Index(name = "courses_index_0", columnList = "course_code"),
                @Index(name = "courses_index_1", columnList = "course_name"),
                @Index(name = "courses_index_2", columnList = "academic_year")
        })
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "course_code", length = 20, nullable = false, unique = true)
    String courseCode;

    @Column(name = "course_name", length = 255, nullable = false, unique = true)
    String courseName;

    @Column(name = "academic_year", nullable = false)
    Integer academicYear;

    @Column(name = "semester", nullable = false)
    Integer semester;

    @Column(name = "room", length = 20, nullable = false)
    String room;

    @Column(name = "start_time", nullable = false)
    LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", length = 10, nullable = false)
    DayEnum dayOfWeek;

    @Column(name = "start_date", nullable = false)
    LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    LocalDate endDate;

    @Column(name = "created_by", nullable = false)
    Long createdBy;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    LocalDateTime updatedAt;
}
