package com.bill.repository.entity;

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
        name = "participation_requests",
        indexes = {
                @Index(name = "participation_requests_index_0", columnList = "participation_id"),
                @Index(name = "participation_requests_index_1", columnList = "student_id")
        })
public class ParticipationRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "participation_id", nullable = false)
    Long participationId;

    @Column(name = "student_id", nullable = false)
    Long studentId;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "is_scored", nullable = false)
    Boolean isScored;

    @Column(name = "score", nullable = false)
    Integer score;
}
