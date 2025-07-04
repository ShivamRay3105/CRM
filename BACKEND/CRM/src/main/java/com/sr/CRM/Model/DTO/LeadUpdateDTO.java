package com.sr.CRM.Model.DTO;

import com.sr.CRM.Model.Lead.LeadStatus;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeadUpdateDTO {
    
    private Long leadId;

    private String name;
    private String email;
    private String phone;
    private String company;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    private LeadStatus status;

    private Long assignedToId;
    private String conversionStatus;
    private String conversionMessage;

}
