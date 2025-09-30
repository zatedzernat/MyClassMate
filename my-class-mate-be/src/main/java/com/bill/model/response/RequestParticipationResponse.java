package com.bill.model.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RequestParticipationResponse {
    Long participationRequestId;
    Long participationId;
    Long studentId;
    String studentNo;
    String studentNameTh;
    String studentNameEn;
    LocalDateTime createdAt;
    Boolean isScored;
    Integer score;
}
