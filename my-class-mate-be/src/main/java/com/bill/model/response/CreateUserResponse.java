package com.bill.model.response;

import com.bill.constant.RoleEnum;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUserResponse {
    Long userId;
    String username;
    RoleEnum role;
    LocalDateTime createdAt;
}
