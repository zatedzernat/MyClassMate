package com.bill.model.response;

import com.bill.constant.AttendanceStatusEnum;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AttendanceResponse {
    Long attendanceId;
    Long studentId;
    String studentNo;
    String studentNameTh;
    String studentNameEn;
    Long courseScheduleId;
    Long courseId;
    String courseCode;
    LocalDateTime createdAt;
    AttendanceStatusEnum status;
    String statusDesc;
    String remark;
}
