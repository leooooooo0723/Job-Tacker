package com.jobtracker.entity.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "offers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Offer {
    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "application_id", unique = true, nullable = false, length = 36)
    private String applicationId;

    @Column(length = 200)
    @Builder.Default
    private String department = "";

    @Column(length = 100)
    @Builder.Default
    private String base = "";

    @Column(length = 200)
    @Builder.Default
    private String salary = "";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String benefits = "";

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
