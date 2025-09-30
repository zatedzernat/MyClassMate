package com.bill.model.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EvaluateParticipationRequest {
    @NotNull
    List<@Valid Evaluate> evaluates;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Evaluate {
        @NotNull
        Long participationRequestId;

        @NotNull
        @Min(0)
        @Max(3)
        Integer score;
    }
}
