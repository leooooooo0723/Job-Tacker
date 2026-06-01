package com.jobtracker.dto.request;

import lombok.Data;

@Data
public class OfferRequest {
    private String department;
    private String base;
    private String salary;
    private String benefits;
}
