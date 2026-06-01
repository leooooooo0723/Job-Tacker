package com.jobtracker.repository.mysql;

import com.jobtracker.entity.mysql.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, String> {
    List<Resume> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Resume> findByIdAndUserId(String id, String userId);
}
