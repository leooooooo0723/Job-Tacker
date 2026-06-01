package com.jobtracker.controller;

import com.jobtracker.security.AuthUser;
import com.jobtracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public Map<String, Object> getDashboard(@AuthenticationPrincipal AuthUser user,
                                             @RequestParam(required = false) String cycleId) {
        return dashboardService.getDashboard(user.getUserId(), cycleId);
    }
}
