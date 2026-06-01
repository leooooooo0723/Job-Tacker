package com.jobtracker.service;

import com.jobtracker.entity.mysql.JobCycle;
import com.jobtracker.repository.mysql.JobCycleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CycleService {

    private final JobCycleRepository cycleRepository;

    public List<JobCycle> getCycles(String userId) {
        return cycleRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public JobCycle createCycle(String userId, String name) {
        cycleRepository.deactivateAllByUserId(userId);
        JobCycle cycle = JobCycle.builder()
                .userId(userId)
                .name(name)
                .isActive(true)
                .build();
        return cycleRepository.save(cycle);
    }

    @Transactional
    public JobCycle updateCycle(String userId, String id, Map<String, Object> updates) {
        JobCycle cycle = cycleRepository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("周期不存在"));

        if (updates.containsKey("name")) cycle.setName((String) updates.get("name"));
        if (updates.containsKey("isActive") && Boolean.TRUE.equals(updates.get("isActive"))) {
            cycleRepository.deactivateAllByUserId(userId);
            cycle.setIsActive(true);
        }
        return cycleRepository.save(cycle);
    }

    @Transactional
    public void deleteCycle(String userId, String id) {
        JobCycle cycle = cycleRepository.findById(id)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("周期不存在"));
        cycleRepository.delete(cycle);
    }
}
