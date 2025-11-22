package com.bill.model;

import com.bill.constant.AttendanceStatusEnum;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface CourseScheduleAttendanceProjection {
    Long getCourseScheduleId();

    Long getCourseId();

    LocalDate getScheduleDate();

    Long getStudentId();

    String getStudentNo();

    String getStudentNameTh();

    String getStudentNameEn();

    AttendanceStatusEnum getStatus();

    LocalDateTime getAttendedAt();

    String getRemark();
}
