package com.bill.model.response;

import com.bill.constant.AttendanceStatusEnum;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@SuperBuilder
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseScheduleForReportResponse extends CourseScheduleResponse {
    List<AttendanceForReport> attendances;
    List<ParticipationForReport> participations;

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
        LocalDateTime attendedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParticipationForReport {
        Integer round;
        String topic;
        List<RequestParticipationForReport> requestParticipations;

        @Data
        @Builder
        @NoArgsConstructor
        @AllArgsConstructor
        public static class RequestParticipationForReport {
            Long studentId;
            String studentNo;
            String studentNameTh;
            String studentNameEn;
            Boolean isScored;
            Integer score;
        }
    }
}
