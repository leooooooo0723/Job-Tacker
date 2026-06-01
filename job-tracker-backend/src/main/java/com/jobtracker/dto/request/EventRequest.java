package com.jobtracker.dto.request;

import lombok.Data;

@Data
public class EventRequest {
    private String applicationId;
    private String type;
    private String scheduledAt;
    private String link;
    private String notes;
}
