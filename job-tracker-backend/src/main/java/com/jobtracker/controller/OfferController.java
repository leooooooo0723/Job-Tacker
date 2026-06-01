package com.jobtracker.controller;

import com.jobtracker.dto.request.OfferRequest;
import com.jobtracker.security.AuthUser;
import com.jobtracker.service.OfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @GetMapping
    public ResponseEntity<?> getOffers(@AuthenticationPrincipal AuthUser user,
                                        @RequestParam(required = false) String cycleId) {
        return ResponseEntity.ok(offerService.getOffers(user.getUserId(), cycleId));
    }

    @PutMapping("/{applicationId}")
    public ResponseEntity<?> upsertOffer(@AuthenticationPrincipal AuthUser user,
                                          @PathVariable String applicationId,
                                          @RequestBody OfferRequest req) {
        try {
            return ResponseEntity.ok(offerService.upsertOffer(user.getUserId(), applicationId, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
