package com.bill.repository.entity;

import com.bill.constant.AttendanceStatusEnum;
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
        name = "attendances",
        indexes = {
                @Index(name = "attendances_index_0", columnList = "student_id"),
                @Index(name = "attendances_index_1", columnList = "course_id"),
                @Index(name = "attendances_index_2", columnList = "course_schedule_id")
        })
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "student_id", nullable = false)
    Long studentId;

    @Column(name = "course_id", nullable = false)
    Long courseId;

    @Column(name = "course_schedule_id", nullable = false)
    Long courseScheduleId;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10, nullable = false)
    AttendanceStatusEnum status;

    @Column(name = "remark", nullable = true)
    String remark;
}
