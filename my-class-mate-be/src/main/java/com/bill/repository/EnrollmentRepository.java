package com.bill.repository;

import com.bill.repository.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {
    List<Enrollment> findByCourseIdOrderByCreatedAtAsc(Long courseId);

    void deleteByCourseId(Long courseId);

    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);
}
