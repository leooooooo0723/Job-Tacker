package com.jobtracker.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CompanyRequest {
    private String name;
    private List<String> tags;
    private String recruitmentUrl;
    private String notes;
}
