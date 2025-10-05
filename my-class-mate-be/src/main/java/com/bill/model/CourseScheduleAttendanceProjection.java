package com.bill.model;

import com.bill.constant.AttendanceStatusEnum;

import java.time.LocalDate;

public interface CourseScheduleAttendanceProjection {
    Long getCourseScheduleId();

    Long getCourseId();

    LocalDate getScheduleDate();

    Long getStudentId();

    String getStudentNo();

    String getStudentNameTh();

    String getStudentNameEn();

    AttendanceStatusEnum getStatus();
}
