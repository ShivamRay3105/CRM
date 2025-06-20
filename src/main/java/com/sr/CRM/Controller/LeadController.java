package com.sr.CRM.Controller;

import org.springframework.web.bind.annotation.RestController;

import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.DTO.LeadUpdateDTO;
import com.sr.CRM.Service.LeadService;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@RestController
public class LeadController {

    @Autowired
    private LeadService leadService;

    // this is for adding lead
    @PostMapping("/addLead")
    public Lead addLead(@RequestBody Lead lead) { 

        return leadService.saveLead(lead);
    }

    @GetMapping("/myLeads")
    public List<Map<String, Object>> getdummyleads() {
        return leadService.getdummyleads();
    }

    @PutMapping("/admin/updateLead/{id}")
    public Lead updateLead(@PathVariable Long id, @RequestBody LeadUpdateDTO leadDUpdateDTO) {
        return leadService.adminUpdateLead(id, leadDUpdateDTO);
    }

    @PutMapping("/EmployeeLeadUpdate")
    public ResponseEntity<String> EmployeeLeadUpdate(@RequestBody Lead l) {
        return leadService.EmployeeLeadUpdate(l);
    }
}