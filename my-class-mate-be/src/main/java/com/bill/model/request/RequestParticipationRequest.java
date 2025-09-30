package com.bill.model.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RequestParticipationRequest {
    @NotNull
    Long participationId;
    @NotNull
    Long studentId;
    @NotNull
    Long courseScheduleId;
}
