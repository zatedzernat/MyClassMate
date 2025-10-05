package com.bill.repository;

import com.bill.model.CourseScheduleAttendanceProjection;
import com.bill.model.CourseScheduleParticipationProjection;
import com.bill.repository.entity.CourseSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CourseScheduleRepository extends JpaRepository<CourseSchedule, Long> {
    void deleteByCourseId(Long courseId);

    List<CourseSchedule> findByCourseIdOrderByScheduleDateAsc(Long courseId);

    List<CourseSchedule> findByScheduleDateOrderByStartTimeAsc(LocalDate scheduleDate);

    @Query(value = """
            select a.id as courseScheduleId, a.course_id, a.schedule_date, coalesce(b.status, 'ABSENT') as status
            from course_schedules a
            left join attendances b on a.id = b.course_schedule_id and a.course_id = b.course_id and b.student_id = :studentId
            where a.course_id = :courseId and a.schedule_date <= :targetDate
            order by a.id asc
            """, nativeQuery = true)
    List<CourseScheduleAttendanceProjection> findCurrentCourseScheduleAttendanceByCourseIdAndStudentId(Long courseId, Long studentId, LocalDate targetDate);

    @Query(value = """
            select
                a.id as courseScheduleId,
                count(c.id) as totalParticipations,
                coalesce(sum(c.score), 0) as totalScore
            from course_schedules a
            left join participations b on a.id = b.course_schedule_id
            left join participation_requests c on b.id = c.participation_id and c.student_id = :studentId
            where a.id = :courseScheduleId
            group by a.id;
            """, nativeQuery = true)
    CourseScheduleParticipationProjection findTotalParticipationsByStudentIdAndCourseScheduleId(Long studentId, Long courseScheduleId);

    @Query(value = """
            select
            a.id as courseScheduleId,
            b.student_id,
            e.student_no,
            concat(d.name_th, ' ', d.surname_th) as studentNameTh,
            concat(d.name_en, ' ', d.surname_en) as studentNameEn,
            coalesce(c.status, 'ABSENT') as status
            from course_schedules a
            left join enrollments b on a.course_id = b.course_id
            left join attendances c on b.student_id = c.student_id and a.id = c.course_schedule_id and a.course_id = c.course_id
            left join users d on b.student_id = d.id
            left join student_profiles e on b.student_id = e.student_id
            where a.course_id = :courseId
            order by a.id, b.student_id
            """, nativeQuery = true)
    List<CourseScheduleAttendanceProjection> findCourseScheduleAttendanceByCourseId(Long courseId);
}
