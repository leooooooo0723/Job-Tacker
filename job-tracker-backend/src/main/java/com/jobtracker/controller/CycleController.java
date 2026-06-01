package com.jobtracker.controller;

import com.jobtracker.entity.mysql.JobCycle;
import com.jobtracker.security.AuthUser;
import com.jobtracker.service.CycleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cycles")
@RequiredArgsConstructor
public class CycleController {

    private final CycleService cycleService;

    @GetMapping
    public List<JobCycle> getCycles(@AuthenticationPrincipal AuthUser user) {
        return cycleService.getCycles(user.getUserId());
    }

    @PostMapping
    public ResponseEntity<JobCycle> createCycle(@AuthenticationPrincipal AuthUser user,
                                                 @RequestBody Map<String, String> body) {
        JobCycle cycle = cycleService.createCycle(user.getUserId(), body.get("name"));
        return ResponseEntity.status(201).body(cycle);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCycle(@AuthenticationPrincipal AuthUser user,
                                          @PathVariable String id,
                                          @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(cycleService.updateCycle(user.getUserId(), id, body));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCycle(@AuthenticationPrincipal AuthUser user,
                                          @PathVariable String id) {
        cycleService.deleteCycle(user.getUserId(), id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
