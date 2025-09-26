package com.bill.repository;

import com.bill.repository.entity.CourseLecturer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseLecturerRepository extends JpaRepository<CourseLecturer, Long> {
    void deleteByCourseId(Long courseId);

    List<CourseLecturer> findByCourseId(Long courseId);
}
