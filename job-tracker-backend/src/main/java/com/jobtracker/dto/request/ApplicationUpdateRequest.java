package com.jobtracker.dto.request;

import lombok.Data;

@Data
public class ApplicationUpdateRequest {
    private String status;
    private String failReason;
    private String notes;
    private String positionName;
    private String jdLink;
    private String base;
}
