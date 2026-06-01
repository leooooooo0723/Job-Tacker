package com.jobtracker.controller;

import com.jobtracker.dto.request.EventRequest;
import com.jobtracker.entity.mysql.Event;
import com.jobtracker.security.AuthUser;
import com.jobtracker.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public ResponseEntity<Event> createEvent(@AuthenticationPrincipal AuthUser user,
                                              @RequestBody EventRequest req) {
        return ResponseEntity.status(201).body(eventService.createEvent(user.getUserId(), req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@AuthenticationPrincipal AuthUser user,
                                          @PathVariable String id,
                                          @RequestBody EventRequest req) {
        try {
            return ResponseEntity.ok(eventService.updateEvent(user.getUserId(), id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@AuthenticationPrincipal AuthUser user,
                                          @PathVariable String id) {
        eventService.deleteEvent(user.getUserId(), id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
