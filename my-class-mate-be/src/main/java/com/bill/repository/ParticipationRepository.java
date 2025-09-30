package com.bill.repository;

import com.bill.constant.ParticipationStatusEnum;
import com.bill.repository.entity.Participation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    @Query(value = """
        SELECT COALESCE(MAX(round), 0)
        FROM   participations
        WHERE  course_schedule_id = :courseScheduleId
        """, nativeQuery = true)
    Integer findMaxRoundByCourseScheduleId(@Param("courseScheduleId") Long courseScheduleId);

    List<Participation> findByCourseScheduleIdAndStatus(Long courseScheduleId, ParticipationStatusEnum status);
}
