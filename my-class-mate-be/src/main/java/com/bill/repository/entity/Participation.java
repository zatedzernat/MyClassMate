package com.bill.repository.entity;

import com.bill.constant.ParticipationStatusEnum;
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
        name = "participations",
        indexes = {
                @Index(name = "participations_index_0", columnList = "course_schedule_id"),
                @Index(name = "participations_index_1", columnList = "status")
        })
public class Participation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "course_schedule_id", nullable = false)
    Long courseScheduleId;

    @Column(name = "round", nullable = false)
    Integer round;

    @Column(name = "topic", length = 255)
    String topic;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10, nullable = false)
    ParticipationStatusEnum status;

    @Column(name = "created_by", nullable = false)
    Long createdBy;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "closed_at")
    LocalDateTime closedAt;
}
