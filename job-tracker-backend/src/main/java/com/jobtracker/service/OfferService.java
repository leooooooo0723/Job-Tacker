package com.jobtracker.service;

import com.jobtracker.dto.request.OfferRequest;
import com.jobtracker.entity.mysql.Application;
import com.jobtracker.entity.mysql.Offer;
import com.jobtracker.repository.mysql.ApplicationRepository;
import com.jobtracker.repository.mysql.OfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final ApplicationRepository applicationRepository;
    private final OfferRepository offerRepository;

    public List<Application> getOffers(String userId, String cycleId) {
        if (cycleId != null && !cycleId.isBlank()) {
            return applicationRepository.findByUserIdAndCycleIdAndStatusWithCompany(userId, cycleId, "offer");
        }
        return applicationRepository.findByUserIdAndStatusWithCompany(userId, "offer");
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
