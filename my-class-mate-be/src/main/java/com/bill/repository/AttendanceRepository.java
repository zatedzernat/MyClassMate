package com.bill.repository;

import com.bill.repository.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Attendance findByStudentIdAndCourseScheduleId(Long studentId, Long courseScheduleId);
}
