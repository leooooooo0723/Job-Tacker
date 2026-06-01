package com.jobtracker.controller;

import com.jobtracker.dto.request.CompanyRequest;
import com.jobtracker.entity.mysql.Company;
import com.jobtracker.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping
    public List<Company> getCompanies() {
        return companyService.getCompanies();
    }

    @PostMapping
    public ResponseEntity<?> createCompany(@RequestBody CompanyRequest req) {
        try {
            return ResponseEntity.status(201).body(companyService.createCompany(req));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCompany(@PathVariable String id,
                                            @RequestBody CompanyRequest req) {
        try {
            return ResponseEntity.ok(companyService.updateCompany(id, req));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCompany(@PathVariable String id) {
        companyService.deleteCompany(id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
