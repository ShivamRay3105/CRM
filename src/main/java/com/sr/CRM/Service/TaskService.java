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
import org.springframework.web.bind.annotation.RequestBody;

import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.DTO.TaskDTO;
import com.sr.CRM.Model.DTO.TaskUpdateDTO;
import com.sr.CRM.Model.Tasks.TaskStatus;
import com.sr.CRM.Repository.LeadRepository;
import com.sr.CRM.Repository.TaskRepository;
import com.sr.CRM.Repository.UserRepository;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeadRepository leadRepository;

    public List<Tasks> getTasksByAssignedTo(Users user) {
        return taskRepository.findByAssignedTo(user);
    }

    // public Tasks addTask(TaskDTO taskDTO) {

    // Users dummyUser = userRepository.findById(1L).orElse(null);

    // Lead lead = leadRepository.findById(taskDTO.getTaskId()).orElse(null);

    // lead.setAssignedTo(dummyUser);

    // Tasks task = new Tasks();
    // task.setLead(lead);
    // task.setTitle(taskDTO.getTitle());
    // task.setDescription(taskDTO.getDescription());
    // task.setDueDate(taskDTO.getDueDate());
    // task.setAssignedTo(dummyUser);
    // task.setStatus(TaskStatus.TODO);

    // return taskRepository.save(task);
    // }

    public Tasks addTask(TaskDTO taskDTO) {

        Users dummyUser = userRepository.findById(1L).orElse(null);
        if (dummyUser == null) {
            throw new RuntimeException("Dummy user not found");
        }

        Lead lead = leadRepository.findById(taskDTO.getLeadId()).orElse(null);
        if (lead == null) {
            throw new RuntimeException("Lead not found with ID: " + taskDTO.getLeadId());
        }

        lead.setAssignedTo(dummyUser);

        Tasks task = new Tasks();
        task.setLead(lead);
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setDueDate(taskDTO.getDueDate());
        task.setAssignedTo(dummyUser);
        task.setStatus(Tasks.TaskStatus.TODO); // ✅ use nested enum correctly

        return taskRepository.save(task);
    }

    public List<Map<String, Object>> getMyTasks() {
        Users dummy = userRepository.findById(1L).orElse(null); // hardcoded ID

        if (dummy != null) {
            List<Tasks> tasks = taskRepository.findByAssignedTo(dummy);

            List<Map<String, Object>> response = new ArrayList<>();

            for (Tasks l : tasks) {
                Map<String, Object> taskMap = new HashMap<>();
                taskMap.put("id", l.getId());
                taskMap.put("Title", l.getTitle());
                taskMap.put("Descriptions", l.getDescription());
                taskMap.put("Due Date", l.getDueDate());
                taskMap.put("Status", l.getStatus());
                taskMap.put("createdAt", l.getCreatedAt());
                taskMap.put("updatedAt", l.getUpdatedAt());
                taskMap.put("Company", l.getLead().getCompany());
                taskMap.put("Lead Executive", l.getLead().getName());
                taskMap.put("assigned To Name", l.getAssignedTo().getName());

                response.add(taskMap);
            }

            return response;
        } else {
            return new ArrayList<>();
        }
    }

    public Tasks adminTaskUpdate(Long id, @Validated TaskUpdateDTO taskUpdateDTO) {

        Tasks task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));

        task.setTitle(taskUpdateDTO.getTitle());
        task.setDueDate(taskUpdateDTO.getDueDate());
        task.setDescription(taskUpdateDTO.getDescription());
        task.setStatus(taskUpdateDTO.getStatus());

        if (taskUpdateDTO.getAssignedToId() != null) {
            Users assignedUser = userRepository.findById(taskUpdateDTO.getAssignedToId())
                    .orElseThrow(
                            () -> new RuntimeException("User not found with ID: " + taskUpdateDTO.getAssignedToId()));
            task.setAssignedTo(assignedUser);
        }

        task.setUpdatedAt(LocalDateTime.now());

        return taskRepository.save(task);
    }

    // public ResponseEntity<String> employeeTaskUpdate(@RequestBody TaskDTO
    // taskDTO) {

    // Users dummyUser = userRepository.findById(1L).orElse(null);

    // if (dummyUser == null) {
    // return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
    // }

    // List<Tasks> employeeTasks = taskRepository.findByAssignedTo(dummyUser);

    // for (Tasks task : employeeTasks) {
    // if (task.getId().equals(taskDTO.getTaskId())) {

    // Tasks existingTask = taskRepository.findByAssignedToId(taskDTO.getTaskId());
    // if (existingTask != null) {
    // existingTask.setTitle(existingTask.getTitle());
    // existingTask.setDueDate(existingTask.getDueDate());
    // existingTask.setDescription(existingTask.getDescription());
    // existingTask.setStatus(existingTask.getStatus());

    // if (existingTask.getStatus() == TaskStatus.DONE) {
    // taskRepository.deleteById(task.getId());
    // } else {
    // existingTask.setUpdatedAt(LocalDateTime.now());
    // taskRepository.save(existingTask);
    // }

    // return ResponseEntity.ok("Task updated successfully: " + existingTask);
    // } else {
    // return ResponseEntity.status(HttpStatus.NOT_FOUND)
    // .body("Task not found in database");
    // }
    // }
    // }

    // return ResponseEntity.status(HttpStatus.FORBIDDEN)
    // .body("You are not authorized to update this Task");
    // }

    public ResponseEntity<String> employeeTaskUpdate(@RequestBody TaskDTO taskDTO) {

        if (taskDTO.getTaskId() == null) {
            return ResponseEntity.badRequest().body("Task ID must not be null");
        }
        Users dummyUser = userRepository.findById(1L).orElse(null);
        if (dummyUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }
        List<Tasks> employeeTasks = taskRepository.findByAssignedTo(dummyUser);
        for (Tasks task : employeeTasks) {
            if (task.getId().equals(taskDTO.getTaskId())) {

                task.setTitle(taskDTO.getTitle());
                task.setDueDate(taskDTO.getDueDate());
                task.setDescription(taskDTO.getDescription());
                task.setStatus(taskDTO.getStatus());

                if (task.getStatus() == TaskStatus.DONE) {
                    taskRepository.deleteById(task.getId());
                } else {
                    task.setUpdatedAt(LocalDateTime.now());
                    taskRepository.save(task);
                }
                return ResponseEntity.ok("Task updated successfully: " + task);
            }
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to update this Task");
    }
    



}
