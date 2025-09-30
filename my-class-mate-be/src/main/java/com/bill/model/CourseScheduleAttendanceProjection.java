package com.bill.model;

import com.bill.constant.AttendanceStatusEnum;

import java.time.LocalDate;

public interface CourseScheduleAttendanceProjection {
    Long getCourseScheduleId();

    Long getCourseId();

    LocalDate getScheduleDate();

    AttendanceStatusEnum getStatus();
}
