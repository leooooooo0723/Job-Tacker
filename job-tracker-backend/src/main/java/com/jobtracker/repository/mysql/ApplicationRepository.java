package com.jobtracker.repository.mysql;

import com.jobtracker.entity.mysql.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, String> {

    @Query("SELECT a FROM Application a JOIN FETCH a.company WHERE a.userId = :userId ORDER BY a.appliedAt DESC")
    List<Application> findByUserIdWithCompany(@Param("userId") String userId);

    @Query("SELECT a FROM Application a JOIN FETCH a.company WHERE a.userId = :userId AND a.cycleId = :cycleId ORDER BY a.appliedAt DESC")
    List<Application> findByUserIdAndCycleIdWithCompany(@Param("userId") String userId, @Param("cycleId") String cycleId);

    @Query("SELECT a FROM Application a JOIN FETCH a.company WHERE a.userId = :userId AND a.status = :status ORDER BY a.updatedAt DESC")
    List<Application> findByUserIdAndStatusWithCompany(@Param("userId") String userId, @Param("status") String status);

    @Query("SELECT a FROM Application a JOIN FETCH a.company WHERE a.userId = :userId AND a.cycleId = :cycleId AND a.status = :status ORDER BY a.updatedAt DESC")
    List<Application> findByUserIdAndCycleIdAndStatusWithCompany(@Param("userId") String userId, @Param("cycleId") String cycleId, @Param("status") String status);

    List<Application> findByUserIdAndCycleId(String userId, String cycleId);
    List<Application> findByUserId(String userId);

    Optional<Application> findByIdAndUserId(String id, String userId);

    @Query("SELECT a FROM Application a JOIN FETCH a.company WHERE a.id IN :ids")
    List<Application> findAllByIdWithCompany(@Param("ids") List<String> ids);

    List<Application> findByCompanyIdAndUserIdAndCycleId(String companyId, String userId, String cycleId);
    List<Application> findByCompanyIdAndUserId(String companyId, String userId);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.userId = :userId AND a.cycleId = :cycleId")
    long countByUserIdAndCycleId(@Param("userId") String userId, @Param("cycleId") String cycleId);
}
