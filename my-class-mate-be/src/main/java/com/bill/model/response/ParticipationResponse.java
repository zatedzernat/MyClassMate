package com.bill.model.response;

import com.bill.constant.ParticipationStatusEnum;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ParticipationResponse {
    Long participationId;
    Long courseScheduleId;
    Integer round;
    String topic;
    ParticipationStatusEnum status;
    Long createdBy;
    LocalDateTime createdAt;
    LocalDateTime closedAt;
}
