package com.sr.CRM.Model.DTO;

import com.sr.CRM.Model.Lead.LeadStatus;

import lombok.Data;

@Data
public class LeadDTO {

    private String name;
    private String email;
    private String phone;
    private String company;
    private LeadStatus status;
    private String conversionStatus;
    private String conversionMessage;
    private Long assignedToId;

}