package com.bill.repository;

import com.bill.repository.entity.Participation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ParticipationRepository extends JpaRepository<Participation, Long> {

    @Query(value = """
            SELECT COALESCE(MAX(round), 0)
            FROM   participations
            WHERE  course_schedule_id = :courseScheduleId
            """, nativeQuery = true)
    Integer findMaxRoundByCourseScheduleId(@Param("courseScheduleId") Long courseScheduleId);

    void deleteByCourseScheduleId(Long courseScheduleId);

    void deleteByCourseScheduleIdIn(Collection<Long> courseScheduleIds);

    List<Participation> findByCourseScheduleIdOrderByRoundAsc(Long courseScheduleId);

    List<Participation> findByCourseScheduleIdIn(Collection<Long> courseScheduleIds);
}
