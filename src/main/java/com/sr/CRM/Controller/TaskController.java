package com.sr.CRM.Controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.DTO.TaskUpdateDTO;
import com.sr.CRM.Model.DTO.TaskDTO;
import com.sr.CRM.Service.TaskService;

@RestController
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/addTask")
    public Tasks addTask(@RequestBody TaskDTO taskDTO) {
        return taskService.addTask(taskDTO);
    }

    @GetMapping("/myTask")
    public List<Map<String, Object>> getMyTasks() {
        return taskService.getMyTasks();
    }

    @PutMapping("/admin/updateTask/{id}")
    public Tasks adminTaskUpdate(@PathVariable Long id, @RequestBody TaskUpdateDTO taskUpdateDTO) {
        return taskService.adminTaskUpdate(id, taskUpdateDTO);
    }

    @PutMapping("/EmployeeTaskUpdate")
    public ResponseEntity<String> EmployeeLeadUpdate(@RequestBody TaskDTO taskDTO) {
        return taskService.employeeTaskUpdate(taskDTO);
    }

}