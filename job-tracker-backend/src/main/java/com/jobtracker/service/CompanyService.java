package com.jobtracker.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobtracker.dto.request.CompanyRequest;
import com.jobtracker.entity.mysql.Company;
import com.jobtracker.repository.mysql.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper;

    public List<Company> getCompanies() {
        return companyRepository.findAllByOrderByNameAsc();
    }

    public Company createCompany(CompanyRequest req) {
        if (companyRepository.existsByName(req.getName())) {
            throw new IllegalStateException("公司名称已存在");
        }
        Company company = Company.builder()
                .name(req.getName())
                .tags(toJson(req.getTags()))
                .recruitmentUrl(orEmpty(req.getRecruitmentUrl()))
                .notes(orEmpty(req.getNotes()))
                .build();
        return companyRepository.save(company);
    }

    public Company updateCompany(String id, CompanyRequest req) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("公司不存在"));
        if (req.getName() != null) company.setName(req.getName());
        if (req.getTags() != null) company.setTags(toJson(req.getTags()));
        if (req.getRecruitmentUrl() != null) company.setRecruitmentUrl(req.getRecruitmentUrl());
        if (req.getNotes() != null) company.setNotes(req.getNotes());
        return companyRepository.save(company);
    }

    public void deleteCompany(String id) {
        companyRepository.deleteById(id);
    }

    private String toJson(List<String> tags) {
        try {
            return tags == null ? "[]" : objectMapper.writeValueAsString(tags);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private String orEmpty(String s) {
        return s == null ? "" : s;
    }
}
