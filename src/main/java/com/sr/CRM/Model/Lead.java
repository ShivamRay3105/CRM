package com.sr.CRM.Model;


import java.time.LocalDateTime;

import jakarta.persistence.Id; 

import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "leads")
public class Lead {
    
    public enum LeadStatus {
        NEW,
        CONTACTED,
        QUALIFIED,
        LOST,
        CONVERTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String email;
    private String phone;
    private String company;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    private LeadStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private Users assignedTo;
    
    @Override
    public String toString() {
        return "Lead [id=" + id + ", name=" + name + ", email=" + email + ", phone=" + phone + ", company=" + company
                + ", status=" + status + ", createdAt=" + createdAt + ", updatedAt=" + updatedAt
                + ", assignedTo=" + assignedTo + "]";
    }

}