package com.sr.CRM.Controller;

import com.sr.CRM.Model.Client;
import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Service.ClientService;
import com.sr.CRM.Service.LeadService;
import com.sr.CRM.Service.TaskService;
import com.sr.CRM.Model.DTO.UserDTO;
import com.sr.CRM.Service.UserService;

import jakarta.transaction.Transactional;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private ClientService clientService;

    @Autowired
    private LeadService leadService;

    @Autowired
    private UserService userService;

    @Autowired
    private TaskService taskService;

    @PostMapping("/addEmployee")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addEmployee(@Valid @RequestBody UserDTO userDTO) {
        try {
            Users savedUser = userService.addEmployee(userDTO, Set.of("ROLE_EMPLOYEE"));
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/addManager")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addManager(@Valid @RequestBody UserDTO userDTO) {
        try {
            Users savedUser = userService.addEmployee(userDTO, Set.of("ROLE_MANAGER"));
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/addAdmin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> addAdmin(@Valid @RequestBody UserDTO userDTO) {
        try {
            Users savedUser = userService.addAdmin(userDTO, Set.of("ROLE_ADMIN"));
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/user/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }

    @GetMapping("/allLeads")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<Map<String, Object>> getAllLeadsForAdmin(Pageable pageable,
            @RequestParam(required = false) String status) {
        Page<Lead> leads = leadService.getAllLeads(pageable, status);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Lead l : leads.getContent()) {
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
            response.add(leadMap);
        }
        return new PageImpl<>(response, pageable, leads.getTotalElements());
    }

    @GetMapping("/getAllClients")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Client> getAllClients() {
        return clientService.getAllClients();
    }

    @GetMapping("/allTasks")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<Map<String, Object>> getAllTasksForAdmin(Pageable pageable,
            @RequestParam(required = false) String status) {
        Page<Tasks> tasks = taskService.getAllTasks(pageable, status);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Tasks t : tasks.getContent()) {
            Map<String, Object> taskMap = new HashMap<>();
            taskMap.put("id", t.getId());
            taskMap.put("title", t.getTitle());
            taskMap.put("description", t.getDescription());
            taskMap.put("dueDate", t.getDueDate());
            taskMap.put("status", t.getStatus());
            taskMap.put("priority", t.getPriority());
            taskMap.put("createdAt", t.getCreatedAt());
            taskMap.put("updatedAt", t.getUpdatedAt());
            taskMap.put("assignedTo", t.getAssignedTo().getName());
            taskMap.put("assignedToId", t.getAssignedTo().getId());
            taskMap.put("assignedBy", t.getAssignedBy().getName());
            taskMap.put("assignedById", t.getAssignedBy().getId());
            response.add(taskMap);
        }
        return new PageImpl<>(response, pageable, tasks.getTotalElements());
    }

    @GetMapping("/getAllEmployees")
    @PreAuthorize("hasRole('ADMIN')")
    public List<Users> getUsers() {
        return userService.getAllEmployees();
    }

    // @PutMapping("/updateEmployee/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    // public ResponseEntity<String> updateEmployee(@PathVariable Long id,
    // @RequestBody Users updatedEmployee,
    // Authentication authentication) {
    // try {
    // userService.updateEmployee(id, updatedEmployee, authentication);
    // return ResponseEntity.ok("Employee updated successfully");
    // } catch (AccessDeniedException e) {
    // return ResponseEntity.status(HttpStatus.FORBIDDEN)
    // .body("Permission denied: " + e.getMessage());
    // } catch (Exception e) {
    // return ResponseEntity.status(HttpStatus.BAD_REQUEST)
    // .body("Error: " + e.getMessage());
    // }
    // }

    // @DeleteMapping("/deleteEmployee/{id}")
    // @PreAuthorize("hasRole('ADMIN')")
    // public ResponseEntity<String> deleteEmployee(@PathVariable Long id) {
    // return userService.deleteEmployee(id);
    // }

    @PutMapping("/updateEmployee/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateEmployee(@PathVariable Long id, @RequestBody Users updatedEmployee,
            Authentication authentication) {
        return userService.updateEmployee(id, updatedEmployee, authentication);
    }

    @DeleteMapping("/deleteEmployee/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteEmployee(@PathVariable Long id) {
        return userService.deleteEmployee(id);
    }
}