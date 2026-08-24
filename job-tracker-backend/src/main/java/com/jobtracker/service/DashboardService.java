package com.jobtracker.service;

import com.jobtracker.entity.mysql.Application;
import com.jobtracker.entity.mysql.Event;
import com.jobtracker.repository.mysql.ApplicationRepository;
import com.jobtracker.repository.mysql.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ApplicationRepository applicationRepository;
    private final EventRepository eventRepository;

    public Map<String, Object> getDashboard(String userId, String cycleId) {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(23, 59, 59);

        List<Event> todayEvents;
        List<Application> applications;

        if (cycleId != null && !cycleId.isBlank()) {
            todayEvents = eventRepository.findTodayEventsByUserIdAndCycleId(userId, cycleId, startOfDay, endOfDay);
            applications = applicationRepository.findByUserIdAndCycleIdWithCompany(userId, cycleId);
        } else {
            todayEvents = eventRepository.findTodayEventsByUserId(userId, startOfDay, endOfDay);
            applications = applicationRepository.findByUserIdWithCompany(userId);
        }

        Map<String, Long> byStatus = applications.stream()
                .collect(Collectors.groupingBy(Application::getStatus, Collectors.counting()));

        // per-status detail list for hover tooltips
        Map<String, List<Map<String, Object>>> byStatusDetails = applications.stream()
                .collect(Collectors.groupingBy(
                        Application::getStatus,
                        Collectors.mapping(a -> {
                            Map<String, Object> item = new HashMap<>();
                            item.put("companyName", a.getCompany() != null ? a.getCompany().getName() : "");
                            item.put("positionName", a.getPositionName());
                            item.put("failNode", a.getFailNode());
                            return item;
                        }, Collectors.toList())
                ));

        Map<String, Application> appMap = applications.stream()
                .collect(Collectors.toMap(Application::getId, a -> a));

        List<Map<String, Object>> eventDtos = todayEvents.stream().map(e -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", e.getId());
            dto.put("type", e.getType());
            dto.put("scheduledAt", e.getScheduledAt());
            dto.put("link", e.getLink());
            dto.put("notes", e.getNotes());
            Application app = appMap.get(e.getApplicationId());
            Map<String, Object> appDto = new HashMap<>();
            Map<String, Object> companyDto = new HashMap<>();
            companyDto.put("name", app != null && app.getCompany() != null ? app.getCompany().getName() : "");
            appDto.put("company", companyDto);
            dto.put("application", appDto);
            return dto;
        }).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("todayEvents", eventDtos);
        result.put("total", applications.size());
        result.put("byStatus", byStatus);
        result.put("byStatusDetails", byStatusDetails);
        return result;
    }
}
