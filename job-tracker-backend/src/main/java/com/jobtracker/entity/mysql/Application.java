package com.jobtracker.entity.mysql;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {
    @Id
    @UuidGenerator
    @Column(length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    @Column(name = "company_id", nullable = false, length = 36)
    private String companyId;

    @Column(name = "cycle_id", nullable = false, length = 36)
    private String cycleId;

    @Column(name = "position_name", length = 200)
    @Builder.Default
    private String positionName = "";

    @Column(name = "jd_link", length = 500)
    @Builder.Default
    private String jdLink = "";

    @Column(length = 100)
    @Builder.Default
    private String base = "";

    @Column(length = 50)
    @Builder.Default
    private String status = "已投递";

    @Column(name = "fail_reason", length = 500)
    private String failReason;

    @Column(name = "fail_node", length = 50)
    private String failNode;

    @Column(name = "applied_at")
    @Builder.Default
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String notes = "";

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
