package com.sr.CRM.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.sr.CRM.Model.Client;
import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.Lead.LeadStatus;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.DTO.LeadUpdateDTO;
import com.sr.CRM.Repository.ClientRepository;
import com.sr.CRM.Repository.LeadRepository;
import com.sr.CRM.Repository.UserRepository;

@Service
public class LeadService {

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClientRepository clientRepository;

    public Lead saveLead(Lead lead) {
        Users dummyUser = userRepository.findById(1L).orElse(null); // hardcoded ID
        lead.setAssignedTo(dummyUser);
        LocalDateTime now = LocalDateTime.now();
        lead.setCreatedAt(now);
        lead.setUpdatedAt(now); 
        return leadRepository.save(lead);
    }

    public List<Lead> getLeadsByAssignedTo(Users user) {
        return leadRepository.findByAssignedTo(user);
    }

    public Lead adminUpdateLead(Long id, @Validated LeadUpdateDTO leadUpdateDTO) {

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));

        lead.setName(leadUpdateDTO.getName());
        lead.setEmail(leadUpdateDTO.getEmail());
        lead.setPhone(leadUpdateDTO.getPhone());
        lead.setCompany(leadUpdateDTO.getCompany());
        lead.setStatus(leadUpdateDTO.getStatus());

        if (leadUpdateDTO.getAssignedToId() != null) {
            Users assignedUser = userRepository.findById(leadUpdateDTO.getAssignedToId())
                    .orElseThrow(
                            () -> new RuntimeException("User not found with ID: " + leadUpdateDTO.getAssignedToId()));
            lead.setAssignedTo(assignedUser);
        }

        lead.setUpdatedAt(LocalDateTime.now());

        return leadRepository.save(lead);
    }

    public List<Map<String, Object>> getdummyleads() {

        Users dummy = userRepository.findById(1L).orElse(null);

        if (dummy != null) {
            List<Lead> leads = leadRepository.findByAssignedTo(dummy);

            List<Map<String, Object>> response = new ArrayList<>();

            for (Lead l : leads) {
                Map<String, Object> leadMap = new HashMap<>();
                leadMap.put("id", l.getId());
                leadMap.put("name", l.getName());
                leadMap.put("email", l.getEmail());
                leadMap.put("phone", l.getPhone());
                leadMap.put("company", l.getCompany());
                leadMap.put("status", l.getStatus());
                leadMap.put("createdAt", l.getCreatedAt());
                leadMap.put("updatedAt", l.getUpdatedAt());
                leadMap.put("assignedToName", l.getAssignedTo().getName());

                response.add(leadMap);
            }

            return response;
        } else {
            return new ArrayList<>();
        }
    }

    public ResponseEntity<String> EmployeeLeadUpdate(Lead l) {

        Users dummyUser = userRepository.findById(1L).orElse(null);

        if (dummyUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }

        List<Lead> employeeLeads = leadRepository.findByAssignedTo(dummyUser);

        for (Lead lead : employeeLeads) {
            if (lead.getId().equals(l.getId())) {

                Lead existingLead = leadRepository.findByAssignedToId(l.getId());
                if (existingLead != null) {
                    existingLead.setName(l.getName());
                    existingLead.setEmail(l.getEmail());
                    existingLead.setPhone(l.getPhone());
                    existingLead.setCompany(l.getCompany());
                    existingLead.setStatus(l.getStatus());

                    if (existingLead.getStatus() == LeadStatus.CONVERTED) {
                        Client client = new Client();
                        client.setName(existingLead.getName());
                        client.setEmail(existingLead.getEmail());
                        client.setPhone(existingLead.getPhone());
                        client.setCompany(existingLead.getCompany());
                        client.setAssignedTo(existingLead.getAssignedTo());
                        client.setCreatedAt(LocalDateTime.now());

                        clientRepository.save(client);

                        leadRepository.deleteById(l.getId());

                    } else {
                        existingLead.setUpdatedAt(LocalDateTime.now());
                        leadRepository.save(existingLead);
                    }

                    return ResponseEntity.ok("Lead updated successfully: " + existingLead);
                } else {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body("Lead not found in database");
                }
            }
        }

        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("You are not authorized to update this lead");
    }
}
