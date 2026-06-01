package com.jobtracker.entity.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "companies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {
    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(unique = true, nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String tags = "[]";

    @Column(name = "recruitment_url", length = 500)
    @Builder.Default
    private String recruitmentUrl = "";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String notes = "";

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
