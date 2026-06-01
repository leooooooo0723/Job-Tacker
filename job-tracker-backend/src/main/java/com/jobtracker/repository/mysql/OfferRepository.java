package com.jobtracker.repository.mysql;

import com.jobtracker.entity.mysql.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OfferRepository extends JpaRepository<Offer, String> {
    Optional<Offer> findByApplicationId(String applicationId);
}
