package com.bill.repository;

import com.bill.repository.entity.ParticipationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParticipationRequestRepository extends JpaRepository<ParticipationRequest, Long> {
    ParticipationRequest findByParticipationIdAndStudentId(Long participationId, Long studentId);

    List<ParticipationRequest> findByParticipationIdOrderByCreatedAtAsc(Long participationId);
}
