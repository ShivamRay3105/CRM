package com.sr.CRM.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import com.sr.CRM.Exception.ResourceNotFoundException;
import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.Lead.LeadStatus;
import com.sr.CRM.Model.DTO.LeadDTO; // New DTO for creating leads
import com.sr.CRM.Model.DTO.LeadUpdateDTO;
import com.sr.CRM.Repository.LeadRepository;
import com.sr.CRM.Repository.UserRepository;

@Service
public class LeadService {

    @Autowired
    private UserService userService;

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UserRepository userRepository;

    public Page<Map<String, Object>> getLeadById(Long id, Pageable pageable) {
        Users currentUser = userService.getCurrentUser();
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        if (!lead.getAssignedTo().getId().equals(currentUser.getId()) &&
                !userService.isManagerOf(currentUser, lead.getAssignedTo())) {
            throw new RuntimeException("You are not authorized to view this lead.");
        }

        Map<String, Object> leadMap = new HashMap<>();
        leadMap.put("id", lead.getId());
        leadMap.put("name", lead.getName());
        leadMap.put("email", lead.getEmail());
        leadMap.put("phone", lead.getPhone());
        leadMap.put("company", lead.getCompany());
        leadMap.put("status", lead.getStatus());
        leadMap.put("createdAt", lead.getCreatedAt());
        leadMap.put("updatedAt", lead.getUpdatedAt());
        leadMap.put("assignedTo", lead.getAssignedTo().getName());

        return new PageImpl<>(List.of(leadMap), pageable, 1);
    }

    public Page<Map<String, Object>> getLeads(Pageable pageable) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        List<Lead> leads = leadRepository.findByAssignedTo(currentUser);
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
            leadMap.put("assignedTo", l.getAssignedTo().getName());
            leadMap.put("assignedToId", l.getAssignedTo().getId());
            leadMap.put("conversion status", l.getConversionStatus());// added
            leadMap.put("conversion message", l.getConversionMessage()); // added
            response.add(leadMap);
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), response.size());
        return new PageImpl<>(response.subList(start, end), pageable,
                response.size());
    }

    public Lead saveLead(LeadDTO leadDTO) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            throw new ResourceNotFoundException("User not found");
        }

        Lead lead = new Lead();
        lead.setName(leadDTO.getName());
        lead.setEmail(leadDTO.getEmail());
        lead.setPhone(leadDTO.getPhone());
        lead.setCompany(leadDTO.getCompany());
        lead.setStatus(leadDTO.getStatus() != null ? leadDTO.getStatus() : LeadStatus.NEW);

        // Handle assignment for managers
        if (currentUser.getRoles().contains("ROLE_MANAGER") && leadDTO.getAssignedToId() != null) {
            Users assignedUser = userRepository.findById(leadDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Assigned user not found with ID: " + leadDTO.getAssignedToId()));
            if (!userService.isManagerOf(currentUser, assignedUser)) {
                throw new ResourceNotFoundException("You are not authorized to assign to this employee");
            }
            lead.setAssignedTo(assignedUser);
        } else {
            lead.setAssignedTo(currentUser);
        }

        LocalDateTime now = LocalDateTime.now();
        lead.setCreatedAt(now);
        lead.setUpdatedAt(now);
        return leadRepository.save(lead);
    }

    public Page<Lead> getLeadsByAssignedTo(Users user, Pageable pageable) {
        return leadRepository.findByAssignedTo(user, pageable);
    }

    public ResponseEntity<String> adminUpdateLead(Long id, @Validated LeadUpdateDTO leadUpdateDTO) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        if (leadUpdateDTO.getName() != null)
            lead.setName(leadUpdateDTO.getName());
        if (leadUpdateDTO.getEmail() != null)
            lead.setEmail(leadUpdateDTO.getEmail());
        if (leadUpdateDTO.getPhone() != null)
            lead.setPhone(leadUpdateDTO.getPhone());
        if (leadUpdateDTO.getCompany() != null)
            lead.setCompany(leadUpdateDTO.getCompany());

        if (leadUpdateDTO.getAssignedToId() != null) {
            Users assignedUser = userRepository.findById(leadUpdateDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with ID: " + leadUpdateDTO.getAssignedToId()));
            lead.setAssignedTo(assignedUser);
        }

        if (leadUpdateDTO.getStatus() != null) {
            lead.setStatus(leadUpdateDTO.getStatus());
        }

        lead.setUpdatedAt(LocalDateTime.now());
        leadRepository.save(lead);
        return ResponseEntity.ok("Lead updated successfully.");
    }

    public ResponseEntity<LeadDTO> employeeLeadUpdate(Long id, @Validated LeadUpdateDTO leadDTO) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        if (!lead.getAssignedTo().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        if (leadDTO.getName() != null)
            lead.setName(leadDTO.getName());
        if (leadDTO.getEmail() != null)
            lead.setEmail(leadDTO.getEmail());
        if (leadDTO.getPhone() != null)
            lead.setPhone(leadDTO.getPhone());
        if (leadDTO.getCompany() != null)
            lead.setCompany(leadDTO.getCompany());
        if (leadDTO.getStatus() != null)
            lead.setStatus(leadDTO.getStatus());

        lead.setUpdatedAt(LocalDateTime.now());
        leadRepository.save(lead);

        // Convert Lead to LeadDTO
        LeadDTO updatedLeadDTO = new LeadDTO();
        updatedLeadDTO.setName(lead.getName());
        updatedLeadDTO.setEmail(lead.getEmail());
        updatedLeadDTO.setPhone(lead.getPhone());
        updatedLeadDTO.setCompany(lead.getCompany());
        updatedLeadDTO.setStatus(lead.getStatus());
        updatedLeadDTO.setConversionStatus(lead.getConversionStatus());
        updatedLeadDTO.setConversionMessage(lead.getConversionMessage());
        leadRepository.save(lead);

        return ResponseEntity.ok(updatedLeadDTO);
    }

    public ResponseEntity<String> managerUpdateLead(Long id, @Validated LeadUpdateDTO leadUpdateDTO) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        Users assignedUser = lead.getAssignedTo();
        boolean isManagerOfLead = assignedUser.getId().equals(currentUser.getId()) ||
                userService.isManagerOf(currentUser, assignedUser);

        if (!isManagerOfLead) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not authorized to update this lead");
        }

        if (leadUpdateDTO.getName() != null)
            lead.setName(leadUpdateDTO.getName());
        if (leadUpdateDTO.getEmail() != null)
            lead.setEmail(leadUpdateDTO.getEmail());
        if (leadUpdateDTO.getPhone() != null)
            lead.setPhone(leadUpdateDTO.getPhone());
        if (leadUpdateDTO.getCompany() != null)
            lead.setCompany(leadUpdateDTO.getCompany());
        if (leadUpdateDTO.getStatus() != null)
            lead.setStatus(leadUpdateDTO.getStatus());
        if (leadUpdateDTO.getAssignedToId() != null) {
            Users newAssignedUser = userRepository.findById(leadUpdateDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Assigned user not found with ID: " + leadUpdateDTO.getAssignedToId()));
            if (!userService.isManagerOf(currentUser, newAssignedUser)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You are not authorized to assign to this employee");
            }
            lead.setAssignedTo(newAssignedUser);
        }

        lead.setUpdatedAt(LocalDateTime.now());
        leadRepository.save(lead);
        return ResponseEntity.ok("Lead updated successfully.");
    }

    public Page<Map<String, Object>> getAllLeadsOfEmployeesUnderThisManager(Pageable pageable) {
        Users currentUser = userService.getCurrentUser();
        if (!currentUser.getRoles().contains("ROLE_MANAGER")) {
            throw new RuntimeException("Access denied: only managers can view this data.");
        }

        List<Users> employees = userRepository.findByManager(currentUser);
        if (employees.isEmpty()) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        List<Lead> allLeads = new ArrayList<>();
        for (Users employee : employees) {
            allLeads.addAll(leadRepository.findByAssignedTo(employee));
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Lead lead : allLeads) {
            Map<String, Object> leadMap = new HashMap<>();
            leadMap.put("id", lead.getId());
            leadMap.put("name", lead.getName());
            leadMap.put("email", lead.getEmail());
            leadMap.put("phone", lead.getPhone());
            leadMap.put("company", lead.getCompany());
            leadMap.put("status", lead.getStatus());
            leadMap.put("assignedTo", lead.getAssignedTo().getName());
            leadMap.put("createdAt", lead.getCreatedAt());
            leadMap.put("updatedAt", lead.getUpdatedAt());
            response.add(leadMap);
        }

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), response.size());
        return new PageImpl<>(response.subList(start, end), pageable, response.size());
    }

    public ResponseEntity<String> deleteLead(Long id) {
        Users currentUser = userService.getCurrentUser();
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        if (!lead.getAssignedTo().getId().equals(currentUser.getId()) &&
                !userService.isManagerOf(currentUser, lead.getAssignedTo()) &&
                !currentUser.getRoles().contains("ROLE_ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to delete this lead");
        }

        leadRepository.deleteById(id);
        return ResponseEntity.ok("Lead deleted successfully.");
    }

    public ResponseEntity<String> approveConversion(Long id, boolean approve, String responseMessage) {
        Users currentUser = userService.getCurrentUser();
        if (!currentUser.getRoles().contains("ROLE_MANAGER")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only managers can approve conversions");
        }

        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + id));

        if (!userService.isManagerOf(currentUser, lead.getAssignedTo()) &&
                !lead.getAssignedTo().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("You are not authorized to approve this conversion");
        }

        if (!"PENDING".equals(lead.getConversionStatus())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Lead is not in PENDING status");
        }

        if (approve) {
            // return performLeadConversion(lead)
            return ResponseEntity.ok("Conversion approved");
        } else {
            lead.setConversionStatus("DENIED");
            lead.setConversionMessage(responseMessage != null ? responseMessage : "Conversion denied");
            leadRepository.save(lead);
            return ResponseEntity.ok("Conversion request denied.");
        }
    }

    public Page<Lead> getAllLeads(Pageable pageable, String status) {
        if (status != null && !status.isEmpty()) {
            return leadRepository.findByStatus(Lead.LeadStatus.valueOf(status), pageable);
        }
        return leadRepository.findAll(pageable);
    }

    public Page<Map<String, Object>> getPendingLeadsForManager(Pageable pageable) {
        Users currentUser = userService.getCurrentUser();
        if (!currentUser.getRoles().contains("ROLE_MANAGER")) {
            throw new RuntimeException("Access denied: only managers can view this data.");
        }

        List<Users> employees = userRepository.findByManager(currentUser);
        if (employees.isEmpty()) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        List<Lead> pendingLeads = new ArrayList<>();
        for (Users employee : employees) {
            pendingLeads.addAll(leadRepository.findByAssignedToAndConversionStatus(employee, "PENDING"));
        }

        List<Map<String, Object>> response = new ArrayList<>();
        for (Lead lead : pendingLeads) {
            Map<String, Object> leadMap = new HashMap<>();
            leadMap.put("id", lead.getId());
            leadMap.put("name", lead.getName());
            leadMap.put("email", lead.getEmail());
            leadMap.put("phone", lead.getPhone());
            leadMap.put("company", lead.getCompany());
            leadMap.put("status", lead.getStatus());
            leadMap.put("assignedTo", lead.getAssignedTo().getName());
            leadMap.put("assignedToId", lead.getAssignedTo().getId());
            leadMap.put("createdAt", lead.getCreatedAt());
            leadMap.put("updatedAt", lead.getUpdatedAt());
            leadMap.put("conversionStatus", lead.getConversionStatus());
            leadMap.put("conversionMessage", lead.getConversionMessage());
            response.add(leadMap);
        }
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), response.size());
        return new PageImpl<>(response.subList(start, end), pageable, response.size());
    }
}