package com.bill.repository.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Table(name = "identities")
public class Identity {
    @Id
    Long id;

    @Column(name = "user_id", nullable = false)
    Long userId;

    @Column(name = "file_name", nullable = false)
    String fileName;

}
