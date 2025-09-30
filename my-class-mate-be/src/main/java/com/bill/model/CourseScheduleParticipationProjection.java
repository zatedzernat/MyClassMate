package com.bill.model;

public interface CourseScheduleParticipationProjection {
    Long getCourseScheduleId();

    Integer getTotalParticipations();

    Integer getTotalScore();
}
