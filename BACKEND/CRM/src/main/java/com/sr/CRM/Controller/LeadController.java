package com.sr.CRM.Controller;

import com.sr.CRM.Exception.ResourceNotFoundException;
import com.sr.CRM.Model.Client;
import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.Client.ClientStatus;
import com.sr.CRM.Model.DTO.ConversionRequestDTO;
import com.sr.CRM.Model.DTO.LeadDTO;
import com.sr.CRM.Model.DTO.LeadUpdateDTO;
import com.sr.CRM.Repository.ClientRepository;
import com.sr.CRM.Repository.LeadRepository;
import com.sr.CRM.Service.LeadService;
import com.sr.CRM.Service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/Leads")
public class LeadController {
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private LeadService leadService;

    @Autowired
    private UserService userService;

    @PostMapping("/addLead")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    // public Lead addLead(@Valid @RequestBody LeadDTO leadDTO) {
    // return leadService.saveLead(leadDTO);
    // }
    public ResponseEntity<?> addLead(@Valid @RequestBody LeadDTO leadDTO) {
        try {
            Lead lead = leadService.saveLead(leadDTO);
            return ResponseEntity.ok(lead);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating lead: " + e.getMessage());
        }
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Page<Map<String, Object>>> getPendingLeads(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Map<String, Object>> pendingLeads = leadService.getPendingLeadsForManager(pageable);
            return ResponseEntity.ok(pendingLeads);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    @GetMapping("/myLeads")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    public Page<Map<String, Object>> getMyLeads(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return leadService.getLeads(pageable);
    }

    @GetMapping("/getLead/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    public Page<Map<String, Object>> getLeadById(@PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return leadService.getLeadById(id, pageable);
    }

    @PutMapping("/updateLead/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    public ResponseEntity<LeadDTO> employeeUpdateLead(@PathVariable Long id,
            @Valid @RequestBody LeadUpdateDTO leadUpdateDTO) {
        return leadService.employeeLeadUpdate(id, leadUpdateDTO);
    }

    @PutMapping("/admin/updateLead/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> adminUpdateLead(@PathVariable Long id,
            @Valid @RequestBody LeadUpdateDTO leadUpdateDTO) {
        return leadService.adminUpdateLead(id, leadUpdateDTO);
    }

    @DeleteMapping("/deleteLead/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<String> deleteLead(@PathVariable Long id) {
        return leadService.deleteLead(id);
    }

    @PostMapping("/convert/{id}")
    public ResponseEntity<?> convertLeadToClient(@PathVariable Long id, @RequestBody ConversionRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            Users currentUser = userService.getCurrentUser();
            Lead lead = leadRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

            if (currentUser.getRoles().contains("ROLE_ADMIN")) {
                ResponseEntity<String> result = performLeadConversion(lead);
                if (result.getStatusCode() == HttpStatus.OK) {
                    return ResponseEntity.ok(lead);
                } else {
                    return ResponseEntity.status(result.getStatusCode()).body(null);
                }
            } else if (currentUser.getRoles().contains("ROLE_MANAGER") &&
                    (lead.getAssignedTo().getId().equals(currentUser.getId()) ||
                            userService.isManagerOf(currentUser, lead.getAssignedTo()))) {
                ResponseEntity<String> result = performLeadConversion(lead);
                if (result.getStatusCode() == HttpStatus.OK) {
                    return ResponseEntity.ok(lead);
                } else {
                    return ResponseEntity.status(result.getStatusCode()).body(null);
                }
            } else if (currentUser.getRoles().contains("ROLE_EMPLOYEE") &&
                    lead.getAssignedTo().getId().equals(currentUser.getId())) {
                lead.setConversionStatus("PENDING");
                lead.setConversionMessage(request.getMessage() != null ? request.getMessage() : "");
                lead.setUpdatedAt(LocalDateTime.now());
                Lead updatedLead = leadRepository.save(lead);
                return ResponseEntity.ok(updatedLead);
            } else {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to convert this lead");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal server error: " + e.getMessage());
        }
    }

    @PostMapping("/approve/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> approveConversion(@PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        boolean approve = Boolean.parseBoolean(request.get("approve").toString());
        String responseMessage = request.get("responseMessage") != null ? request.get("responseMessage").toString()
                : null;
        Users currentUser = userService.getCurrentUser();
        if (!currentUser.getRoles().contains("ROLE_MANAGER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Only managers can approve conversions");
        }

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        if (!userService.isManagerOf(currentUser, lead.getAssignedTo()) &&
                !lead.getAssignedTo().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not authorized to approve this conversion");
        }

        if (!"PENDING".equals(lead.getConversionStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Lead is not in PENDING status");
        }

        if (approve) {
            return performLeadConversion(lead);
        } else {
            lead.setConversionStatus("DENIED");
            lead.setConversionMessage(responseMessage != null ? responseMessage : "Conversion denied");
            lead.setUpdatedAt(LocalDateTime.now());
            leadRepository.save(lead);
            return ResponseEntity.ok("Conversion request denied.");
        }
    }

    private ResponseEntity<String> performLeadConversion(Lead lead) {
        Client client = new Client();
        client.setName(lead.getName());
        client.setEmail(lead.getEmail());
        client.setPhone(lead.getPhone());
        client.setCompany(lead.getCompany());
        client.setAssignedTo(lead.getAssignedTo());
        client.setCreatedAt(LocalDateTime.now());
        client.setStatus(ClientStatus.ACTIVE);

        clientRepository.save(client);
        leadRepository.deleteById(lead.getId());
        return ResponseEntity.ok("Lead converted to client successfully.");
    }
}