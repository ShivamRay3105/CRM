package com.sr.CRM.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.sr.CRM.Model.Client;
import com.sr.CRM.Service.ClientService;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private ClientService clientService;   

    @GetMapping("/Employee/allClients")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public Page<Map<String, Object>> getEmployeeClients(Pageable pageable) {
        Page<Client> clients = clientService.getEmployeeClients(pageable);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Client c : clients.getContent()) {
            Map<String, Object> clientMap = new HashMap<>();
            clientMap.put("id", c.getId());
            clientMap.put("name", c.getName());
            clientMap.put("email", c.getEmail());
            clientMap.put("phone", c.getPhone());
            clientMap.put("company", c.getCompany());
            clientMap.put("address", c.getAddress());
            clientMap.put("status", c.getStatus().toString());
            clientMap.put("createdAt", c.getCreatedAt());
            clientMap.put("assignedTo", c.getAssignedTo().getName());
            clientMap.put("assignedToId", c.getAssignedTo().getId());
            response.add(clientMap);
        }
        return new PageImpl<>(response, pageable, clients.getTotalElements());
    }

    @GetMapping("/Manager/allClientsOfEmployees")
    @PreAuthorize("hasRole('MANAGER')")
    public Page<Map<String, Object>> getTeamClients(Pageable pageable) {
        Page<Client> clients = clientService.getTeamClients(pageable);
        List<Map<String, Object>> response = new ArrayList<>();
        for (Client c : clients.getContent()) {
            Map<String, Object> clientMap = new HashMap<>();
            clientMap.put("id", c.getId());
            clientMap.put("name", c.getName());
            clientMap.put("email", c.getEmail());
            clientMap.put("phone", c.getPhone());
            clientMap.put("company", c.getCompany());
            clientMap.put("address", c.getAddress());
            clientMap.put("status", c.getStatus().toString());
            clientMap.put("createdAt", c.getCreatedAt());
            clientMap.put("assignedTo", c.getAssignedTo().getName());
            clientMap.put("assignedToId", c.getAssignedTo().getId());
            response.add(clientMap);
        }
        return new PageImpl<>(response, pageable, clients.getTotalElements());
    }
}