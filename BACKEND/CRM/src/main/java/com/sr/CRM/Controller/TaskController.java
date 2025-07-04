
package com.sr.CRM.Controller;

import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.DTO.TaskDTO;
import com.sr.CRM.Model.DTO.TaskUpdateDTO;
import com.sr.CRM.Service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/Tasks")
public class TaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping("/addTask")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    public Tasks addTask(@Valid @RequestBody TaskDTO taskDTO) {
        return taskService.addTask(taskDTO);
    }

    @GetMapping("/myTasks")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    public Page<Map<String, Object>> getMyTasks(@RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return taskService.getMyTasks(pageable);
    }

    @GetMapping("/getTask/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    public Map<String, Object> getTaskById(@PathVariable Long id) {
        return taskService.getTaskById(id);
    }

    @PutMapping("/TaskUpdate/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER')")
    public ResponseEntity<?> employeeTaskUpdate(@PathVariable Long id,
            @Valid @RequestBody TaskUpdateDTO taskUpdateDTO) {
        return ResponseEntity.ok(taskService.employeeTaskUpdate(id, taskUpdateDTO));
    }

    @PutMapping("/admin/updateTask/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> adminTaskUpdate(@PathVariable Long id,
            @Valid @RequestBody TaskUpdateDTO taskUpdateDTO) {
        return taskService.adminTaskUpdate(id, taskUpdateDTO);
    }

    @DeleteMapping("/deleteTask/{id}")
    @PreAuthorize("hasAnyRole('EMPLOYEE','MANAGER','ADMIN')")
    public ResponseEntity<String> deleteTask(@PathVariable Long id) {
        return taskService.deleteTask(id);
    }
}