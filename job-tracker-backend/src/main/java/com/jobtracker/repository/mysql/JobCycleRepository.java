package com.jobtracker.repository.mysql;

import com.jobtracker.entity.mysql.JobCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface JobCycleRepository extends JpaRepository<JobCycle, String> {
    List<JobCycle> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<JobCycle> findByUserIdAndIsActiveTrue(String userId);

    @Modifying
    @Query("UPDATE JobCycle c SET c.isActive = false WHERE c.userId = :userId")
    void deactivateAllByUserId(String userId);
}
