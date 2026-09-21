package com.jobtracker.service;

import com.jobtracker.dto.request.OfferRequest;
import com.jobtracker.entity.mysql.Application;
import com.jobtracker.entity.mysql.Offer;
import com.jobtracker.repository.mysql.ApplicationRepository;
import com.jobtracker.repository.mysql.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final ApplicationRepository applicationRepository;
    private final OfferRepository offerRepository;

    public List<Map<String, Object>> getOffers(String userId, String cycleId) {
        List<Application> apps = (cycleId != null && !cycleId.isBlank())
                ? applicationRepository.findByUserIdAndCycleIdAndStatusWithCompany(userId, cycleId, "offer")
                : applicationRepository.findByUserIdAndStatusWithCompany(userId, "offer");

        return apps.stream().map(app -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", app.getId());
            dto.put("positionName", app.getPositionName());
            Map<String, String> company = new HashMap<>();
            company.put("name", app.getCompany() != null ? app.getCompany().getName() : "");
            dto.put("company", company);

            offerRepository.findByApplicationId(app.getId()).ifPresentOrElse(
                    offer -> {
                        Map<String, String> offerDto = new HashMap<>();
                        offerDto.put("department", offer.getDepartment());
                        offerDto.put("base", offer.getBase());
                        offerDto.put("salary", offer.getSalary());
                        offerDto.put("benefits", offer.getBenefits());
                        dto.put("offer", offerDto);
                    },
                    () -> dto.put("offer", null)
            );
            return dto;
        }).collect(Collectors.toList());
    }

    public Offer upsertOffer(String userId, String applicationId, OfferRequest req) {
        applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("投递记录不存在"));

        Offer offer = offerRepository.findByApplicationId(applicationId)
                .orElse(Offer.builder().applicationId(applicationId).build());

        if (req.getDepartment() != null) offer.setDepartment(req.getDepartment());
        if (req.getBase() != null) offer.setBase(req.getBase());
        if (req.getSalary() != null) offer.setSalary(req.getSalary());
        if (req.getBenefits() != null) offer.setBenefits(req.getBenefits());
        return offerRepository.save(offer);
    }
}
