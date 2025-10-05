package com.bill.model.response;

import com.bill.constant.AttendanceStatusEnum;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseScheduleForReportResponse extends CourseScheduleResponse {
    List<AttendanceForReport> attendances;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceForReport {
        Long studentId;
        String studentNo;
        String studentNameTh;
        String studentNameEn;
        AttendanceStatusEnum status;
        String statusDesc;
    }
}
