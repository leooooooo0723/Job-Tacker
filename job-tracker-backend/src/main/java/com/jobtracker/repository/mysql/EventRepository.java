package com.jobtracker.repository.mysql;

import com.jobtracker.entity.mysql.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, String> {
    List<Event> findByApplicationIdOrderByScheduledAtAsc(String applicationId);

    @Query("SELECT e FROM Event e JOIN Application a ON e.applicationId = a.id WHERE a.userId = :userId AND e.scheduledAt BETWEEN :start AND :end ORDER BY e.scheduledAt ASC")
    List<Event> findTodayEventsByUserId(@Param("userId") String userId,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);

    @Query("SELECT e FROM Event e JOIN Application a ON e.applicationId = a.id WHERE a.userId = :userId AND a.cycleId = :cycleId AND e.scheduledAt BETWEEN :start AND :end ORDER BY e.scheduledAt ASC")
    List<Event> findTodayEventsByUserIdAndCycleId(@Param("userId") String userId,
                                                   @Param("cycleId") String cycleId,
                                                   @Param("start") LocalDateTime start,
                                                   @Param("end") LocalDateTime end);

    @Query("SELECT e FROM Event e JOIN Application a ON e.applicationId = a.id WHERE e.id = :id AND a.userId = :userId")
    Optional<Event> findByIdAndUserId(@Param("id") String id, @Param("userId") String userId);
}
