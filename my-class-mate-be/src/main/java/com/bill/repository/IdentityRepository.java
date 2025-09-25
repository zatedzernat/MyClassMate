package com.bill.repository;

import com.bill.repository.entity.Identity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IdentityRepository extends JpaRepository<Identity, Long> {
    List<Identity> findByUserId(Long userId);
}
