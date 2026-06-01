package com.jobtracker.entity.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Event {
    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "application_id", nullable = false, length = 36)
    private String applicationId;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(name = "scheduled_at", nullable = false)
    private LocalDateTime scheduledAt;

    @Column(length = 500)
    @Builder.Default
    private String link = "";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String notes = "";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
