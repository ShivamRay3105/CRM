package com.sr.CRM.Controller;

import com.sr.CRM.Model.Client;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.DTO.LeadUpdateDTO;
import com.sr.CRM.Model.DTO.TaskUpdateDTO;
import com.sr.CRM.Service.ClientService;
import com.sr.CRM.Service.LeadService;
import com.sr.CRM.Service.TaskService;
import com.sr.CRM.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/Manager")
public class ManagerController {
    @Autowired
    private ClientService clientService;

    @Autowired
    private LeadService leadService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserService userService;

    @PutMapping("/updateLeads/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> managerUpdateLeadsOfEmployeesUnderHim(@PathVariable Long id,
            @Validated @RequestBody LeadUpdateDTO leadUpdateDTO) {
        return leadService.managerUpdateLead(id, leadUpdateDTO);
    }

    @GetMapping("/allLeadsOfEmployees")
    @PreAuthorize("hasRole('MANAGER')")
    public Page<Map<String, Object>> getAllLeadsOfEmployees(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return leadService.getAllLeadsOfEmployeesUnderThisManager(pageable);
    }

    @GetMapping("/allTasksOfEmployees")
    @PreAuthorize("hasRole('MANAGER')")
    public Page<Map<String, Object>> getAllTasksOfEmployees(Pageable pageable,
            @RequestParam(required = false) String status) {
        return taskService.getAllTasksOfEmployees(pageable, status);
    }

    @PutMapping("/updateEmployeeTask/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> managerUpdateEmployeeTask(@PathVariable Long id,
            @Validated @RequestBody TaskUpdateDTO taskUpdateDTO) {
        return taskService.managerTaskUpdate(id, taskUpdateDTO);
    }

    @GetMapping("/employees")
    @PreAuthorize("hasRole('MANAGER')")
    public List<Map<String, Object>> getEmployees() {
        Users currentUser = userService.getCurrentUser();
        List<Users> employees = userService.getEmployeesUnderManager(currentUser);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Users employee : employees) {
            Map<String, Object> employeeMap = new HashMap<>();
            employeeMap.put("id", employee.getId());
            employeeMap.put("name", employee.getName());
            employeeMap.put("username", employee.getUsername());
            response.add(employeeMap);
        }
        return response;
    }

    @PutMapping("/updateClient/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> updateClient(@PathVariable Long id, @RequestBody Client updatedClient,
            Authentication authentication) {
        try {
            clientService.updateClient(id, updatedClient, authentication);
            return ResponseEntity.ok("Client updated successfully");
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Permission denied: " + e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/deleteClient/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<String> deleteClient(@PathVariable Long id) {
        return clientService.deleteClient(id);
    }

}