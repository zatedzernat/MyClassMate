package com.bill.repository.entity;

import com.bill.constant.ParticipationStatusEnum;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "participations")
public class Participation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;
    Long courseScheduleId;
    Integer round;
    String topic;
    @Enumerated(EnumType.STRING)
    ParticipationStatusEnum status;
    Long createdBy;
    LocalDateTime createdAt;
    LocalDateTime closedAt;
}
