package com.jobtracker.service;

import com.jobtracker.dto.request.EventRequest;
import com.jobtracker.entity.mysql.Event;
import com.jobtracker.repository.mysql.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;

    public Event createEvent(String userId, EventRequest req) {
        Event event = Event.builder()
                .applicationId(req.getApplicationId())
                .type(req.getType())
                .scheduledAt(LocalDateTime.parse(req.getScheduledAt()))
                .link(req.getLink() != null ? req.getLink() : "")
                .notes(req.getNotes() != null ? req.getNotes() : "")
                .build();
        return eventRepository.save(event);
    }

    public Event updateEvent(String userId, String id, EventRequest req) {
        Event event = eventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("事件不存在"));
        if (req.getType() != null) event.setType(req.getType());
        if (req.getScheduledAt() != null) event.setScheduledAt(LocalDateTime.parse(req.getScheduledAt()));
        if (req.getLink() != null) event.setLink(req.getLink());
        if (req.getNotes() != null) event.setNotes(req.getNotes());
        return eventRepository.save(event);
    }

    public void deleteEvent(String userId, String id) {
        Event event = eventRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("事件不存在"));
        eventRepository.delete(event);
    }
}
