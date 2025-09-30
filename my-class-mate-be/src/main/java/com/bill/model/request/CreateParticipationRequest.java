package com.bill.model.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateParticipationRequest {
    @NotNull
    Long courseScheduleId;
    @NotNull
    Long lecturerId;
    @NotBlank
    String topic;
}
