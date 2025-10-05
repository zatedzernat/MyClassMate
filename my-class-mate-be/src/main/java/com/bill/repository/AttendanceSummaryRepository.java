package com.bill.repository;

import com.bill.repository.entity.AttendanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceSummaryRepository extends JpaRepository<AttendanceSummary, Long> {
    AttendanceSummary findByStudentIdAndCourseId(Long studentId, Long courseId);

    void deleteByCourseId(Long courseId);
}
