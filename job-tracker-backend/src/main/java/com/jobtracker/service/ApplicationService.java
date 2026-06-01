package com.jobtracker.service;

import com.jobtracker.dto.request.ApplicationRequest;
import com.jobtracker.dto.request.ApplicationUpdateRequest;
import com.jobtracker.entity.mysql.Application;
import com.jobtracker.repository.mysql.ApplicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;

    public List<Application> getApplications(String userId, String cycleId) {
        if (cycleId != null && !cycleId.isBlank()) {
            return applicationRepository.findByUserIdAndCycleIdWithCompany(userId, cycleId);
        }
        return applicationRepository.findByUserIdWithCompany(userId);
    }

    public Application createApplication(String userId, ApplicationRequest req) {
        Application app = Application.builder()
                .userId(userId)
                .companyId(req.getCompanyId())
                .cycleId(req.getCycleId())
                .positionName(orEmpty(req.getPositionName()))
                .jdLink(orEmpty(req.getJdLink()))
                .base(orEmpty(req.getBase()))
                .status(req.getStatus() != null ? req.getStatus() : "已投递")
                .notes(orEmpty(req.getNotes()))
                .build();
        return applicationRepository.save(app);
    }

    public Application updateApplication(String userId, String id, ApplicationUpdateRequest req) {
        Application app = applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("投递记录不存在"));
        if (req.getStatus() != null) app.setStatus(req.getStatus());
        if (req.getFailReason() != null) app.setFailReason(req.getFailReason());
        if (req.getNotes() != null) app.setNotes(req.getNotes());
        if (req.getPositionName() != null) app.setPositionName(req.getPositionName());
        if (req.getJdLink() != null) app.setJdLink(req.getJdLink());
        if (req.getBase() != null) app.setBase(req.getBase());
        return applicationRepository.save(app);
    }

    public void deleteApplication(String userId, String id) {
        Application app = applicationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("投递记录不存在"));
        applicationRepository.delete(app);
    }

    private String orEmpty(String s) { return s == null ? "" : s; }
}
