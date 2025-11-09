package com.bill.model;

public interface CourseScheduleParticipationProjection {
    Long getCourseId();

    Long getCourseScheduleId();

    Integer getRound();

    String getTopic();

    Long getStudentId();

    String getStudentNo();

    String getStudentNameTh();

    String getStudentNameEn();

    Boolean getIsScored();

    Integer getScore();

    Integer getTotalParticipations();

    Integer getTotalScore();
}
