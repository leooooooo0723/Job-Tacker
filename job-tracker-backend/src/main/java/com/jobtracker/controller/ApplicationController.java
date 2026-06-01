package com.jobtracker.controller;

import com.jobtracker.dto.request.ApplicationRequest;
import com.jobtracker.dto.request.ApplicationUpdateRequest;
import com.jobtracker.entity.mysql.Application;
import com.jobtracker.security.AuthUser;
import com.jobtracker.service.ApplicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;

    @GetMapping
    public List<Application> getApplications(@AuthenticationPrincipal AuthUser user,
                                              @RequestParam(required = false) String cycleId) {
        return applicationService.getApplications(user.getUserId(), cycleId);
    }

    @PostMapping
    public ResponseEntity<Application> createApplication(@AuthenticationPrincipal AuthUser user,
                                                          @RequestBody ApplicationRequest req) {
        return ResponseEntity.status(201).body(applicationService.createApplication(user.getUserId(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateApplication(@AuthenticationPrincipal AuthUser user,
                                                @PathVariable String id,
                                                @RequestBody ApplicationUpdateRequest req) {
        try {
            return ResponseEntity.ok(applicationService.updateApplication(user.getUserId(), id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@AuthenticationPrincipal AuthUser user,
                                                @PathVariable String id) {
        applicationService.deleteApplication(user.getUserId(), id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
