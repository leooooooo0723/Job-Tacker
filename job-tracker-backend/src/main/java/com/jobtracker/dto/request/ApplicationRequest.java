package com.jobtracker.dto.request;

import lombok.Data;

@Data
public class ApplicationRequest {
    private String companyId;
    private String cycleId;
    private String positionName;
    private String jdLink;
    private String base;
    private String status;
    private String notes;
}
