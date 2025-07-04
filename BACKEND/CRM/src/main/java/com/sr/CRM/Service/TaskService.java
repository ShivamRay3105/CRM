package com.sr.CRM.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.DTO.TaskDTO;
import com.sr.CRM.Model.DTO.TaskUpdateDTO;
import com.sr.CRM.Model.Tasks.TaskPriority;
import com.sr.CRM.Model.Tasks.TaskStatus;
import com.sr.CRM.Repository.LeadRepository;
import com.sr.CRM.Repository.TaskRepository;
import com.sr.CRM.Repository.UserRepository;

@Service
public class TaskService {

    @Autowired
    private UserService userService;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LeadRepository leadRepository;

    public Page<Tasks> getTasksByAssignedTo(Users user, Pageable pageable) {
        return taskRepository.findByAssignedTo(user, pageable);
    }

    public Tasks addTask(TaskDTO taskDTO) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("User not found");
        }

        Lead lead = null;
        if (taskDTO.getLeadId() != null) {
            lead = leadRepository.findById(taskDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + taskDTO.getLeadId()));
        }

        if (taskDTO.getDueDate() != null && taskDTO.getDueDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Due date must be in the future");
        }

        Users assignedTo = currentUser;
        if (taskDTO.getAssignedToId() != null) {
            assignedTo = userRepository.findById(taskDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with ID: " + taskDTO.getAssignedToId()));
            if (!userService.isManagerOf(currentUser, assignedTo) && !assignedTo.getId().equals(currentUser.getId())) {
                throw new RuntimeException("You cannot assign this task to this user");
            }
        }

        Tasks task = new Tasks();
        task.setLead(lead);
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setDueDate(taskDTO.getDueDate());
        task.setAssignedTo(assignedTo);
        task.setAssignedBy(currentUser);
        task.setStatus(taskDTO.getStatus() != null ? taskDTO.getStatus() : TaskStatus.TODO);
        task.setPriority(taskDTO.getPriority() != null ? taskDTO.getPriority() : TaskPriority.MEDIUM);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());

        return taskRepository.save(task);
    }

    public Page<Map<String, Object>> getMyTasks(Pageable pageable) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        Page<Tasks> tasksPage = taskRepository.findByAssignedTo(currentUser, pageable);
        List<Map<String, Object>> response = new ArrayList<>();

        for (Tasks task : tasksPage.getContent()) {
            Map<String, Object> taskMap = new HashMap<>();
            taskMap.put("id", task.getId());
            taskMap.put("title", task.getTitle());
            taskMap.put("description", task.getDescription());
            taskMap.put("dueDate", task.getDueDate());
            taskMap.put("status", task.getStatus());
            taskMap.put("priority", task.getPriority());
            taskMap.put("createdAt", task.getCreatedAt());
            taskMap.put("updatedAt", task.getUpdatedAt());
            taskMap.put("assignedTo", task.getAssignedTo().getUsername());
            taskMap.put("assignedToId", task.getAssignedTo().getId());
            taskMap.put("assignedBy", task.getAssignedBy().getUsername());
            taskMap.put("assignedById", task.getAssignedBy().getId());
            taskMap.put("leadId", task.getLead() != null ? task.getLead().getId() : null);
            if (task.getLead() != null) {
                taskMap.put("company", task.getLead().getCompany());
                taskMap.put("leadExecutive", task.getLead().getName());
            }
            response.add(taskMap);
        }

        return new PageImpl<>(response, pageable, tasksPage.getTotalElements());
    }

    public ResponseEntity<String> adminTaskUpdate(Long id, @Validated TaskUpdateDTO taskUpdateDTO) {
        Tasks task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        if (taskUpdateDTO.getDueDate() != null && taskUpdateDTO.getDueDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Due date must be in the future");
        }

        if (taskUpdateDTO.getTitle() != null)
            task.setTitle(taskUpdateDTO.getTitle());
        if (taskUpdateDTO.getDescription() != null)
            task.setDescription(taskUpdateDTO.getDescription());
        if (taskUpdateDTO.getDueDate() != null)
            task.setDueDate(taskUpdateDTO.getDueDate());
        if (taskUpdateDTO.getStatus() != null)
            task.setStatus(taskUpdateDTO.getStatus());
        if (taskUpdateDTO.getPriority() != null)
            task.setPriority(taskUpdateDTO.getPriority());

        if (taskUpdateDTO.getAssignedToId() != null) {
            Users assignedUser = userRepository.findById(taskUpdateDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with ID: " + taskUpdateDTO.getAssignedToId()));
            task.setAssignedTo(assignedUser);
        }

        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);
        return ResponseEntity.ok("Task updated successfully.");
    }

    public ResponseEntity<String> employeeTaskUpdate(Long id, @Validated TaskUpdateDTO taskDTO) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }

        Tasks task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        if (!task.getAssignedTo().getId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to update this task");
        }

        if (taskDTO.getDueDate() != null && taskDTO.getDueDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Due date must be in the future");
        }

        if (taskDTO.getTitle() != null)
            task.setTitle(taskDTO.getTitle());
        if (taskDTO.getDescription() != null)
            task.setDescription(taskDTO.getDescription());
        if (taskDTO.getDueDate() != null)
            task.setDueDate(taskDTO.getDueDate());
        if (taskDTO.getStatus() != null)
            task.setStatus(taskDTO.getStatus());
        if (taskDTO.getPriority() != null)
            task.setPriority(taskDTO.getPriority());
        if (taskDTO.getLeadId() != null) {
            Lead lead = leadRepository.findById(taskDTO.getLeadId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lead not found with ID: " + taskDTO.getLeadId()));
            task.setLead(lead);
        }

        // Employees cannot change assignedTo
        if (taskDTO.getAssignedToId() != null && !taskDTO.getAssignedToId().equals(currentUser.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Employees cannot reassign tasks");
        }

        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);
        return ResponseEntity.ok("Task updated successfully.");
    }

    public Map<String, Object> getTaskById(Long id) {
        Users currentUser = userService.getCurrentUser();
        Tasks task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        if (!task.getAssignedTo().getId().equals(currentUser.getId()) &&
                !userService.isManagerOf(currentUser, task.getAssignedTo())) {
            throw new RuntimeException("You are not authorized to view this task.");
        }

        Map<String, Object> taskMap = new HashMap<>();
        taskMap.put("id", task.getId());
        taskMap.put("title", task.getTitle());
        taskMap.put("description", task.getDescription());
        taskMap.put("dueDate", task.getDueDate());
        taskMap.put("status", task.getStatus());
        taskMap.put("priority", task.getPriority());
        taskMap.put("createdAt", task.getCreatedAt());
        taskMap.put("updatedAt", task.getUpdatedAt());
        taskMap.put("assignedTo", task.getAssignedTo().getUsername());
        taskMap.put("assignedToId", task.getAssignedTo().getId());
        taskMap.put("assignedBy", task.getAssignedBy().getUsername());
        taskMap.put("assignedById", task.getAssignedBy().getId());
        if (task.getLead() != null) {
            taskMap.put("company", task.getLead().getCompany());
            taskMap.put("leadExecutive", task.getLead().getName());
        }

        return taskMap;
    }

    public ResponseEntity<String> deleteTask(Long id) {
        Users currentUser = userService.getCurrentUser();
        Tasks task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        if (!task.getAssignedTo().getId().equals(currentUser.getId()) &&
                !userService.isManagerOf(currentUser, task.getAssignedTo()) &&
                !currentUser.getRoles().contains("ROLE_ADMIN")) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to delete this task");
        }

        taskRepository.deleteById(id);
        return ResponseEntity.ok("Task deleted successfully.");
    }

    public Page<Map<String, Object>> getAllTasksOfEmployees(Pageable pageable, String status) {
        Users currentUser = userService.getCurrentUser();
        if (!currentUser.getRoles().contains("ROLE_MANAGER")) {
            throw new RuntimeException("Access denied: only managers can view this data.");
        }

        List<Users> employees = userRepository.findByManager(currentUser);
        if (employees.isEmpty()) {
            return new PageImpl<>(new ArrayList<>(), pageable, 0);
        }

        Page<Tasks> tasksPage = status != null && !status.isEmpty()
                ? taskRepository.findByAssignedToInAndStatus(employees, status, pageable)
                : taskRepository.findByAssignedToIn(employees, pageable);

        List<Map<String, Object>> response = new ArrayList<>();
        for (Tasks task : tasksPage.getContent()) {
            Map<String, Object> taskMap = new HashMap<>();
            taskMap.put("id", task.getId());
            taskMap.put("title", task.getTitle());
            taskMap.put("description", task.getDescription());
            taskMap.put("dueDate", task.getDueDate());
            taskMap.put("status", task.getStatus());
            taskMap.put("priority", task.getPriority());
            taskMap.put("createdAt", task.getCreatedAt());
            taskMap.put("updatedAt", task.getUpdatedAt());
            taskMap.put("assignedTo", task.getAssignedTo().getName());
            taskMap.put("assignedToId", task.getAssignedTo().getId());
            taskMap.put("assignedBy", task.getAssignedBy().getName());
            taskMap.put("assignedById", task.getAssignedBy().getId());
            taskMap.put("leadId", task.getLead() != null ? task.getLead().getId() : null);
            if (task.getLead() != null) {
                taskMap.put("company", task.getLead().getCompany());
                taskMap.put("leadExecutive", task.getLead().getName());
            }
            response.add(taskMap);
        }
        return new PageImpl<>(response, pageable, tasksPage.getTotalElements());
    }

    public ResponseEntity<String> managerTaskUpdate(Long id, @Validated TaskUpdateDTO taskDTO) {
        Users currentUser = userService.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
        }

        Tasks task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with ID: " + id));

        Users assignedUser = task.getAssignedTo();
        boolean isManagerOfTask = assignedUser.getId().equals(currentUser.getId()) ||
                userService.isManagerOf(currentUser, assignedUser);

        if (!isManagerOfTask) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to update this task");
        }

        if (taskDTO.getDueDate() != null && taskDTO.getDueDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body("Due date must be in the future");
        }

        if (taskDTO.getTitle() != null)
            task.setTitle(taskDTO.getTitle());
        if (taskDTO.getDescription() != null)
            task.setDescription(taskDTO.getDescription());
        if (taskDTO.getDueDate() != null)
            task.setDueDate(taskDTO.getDueDate());
        if (taskDTO.getStatus() != null)
            task.setStatus(taskDTO.getStatus());
        if (taskDTO.getPriority() != null)
            task.setPriority(taskDTO.getPriority());

        if (taskDTO.getAssignedToId() != null) {
            Users assignedTo = userRepository.findById(taskDTO.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with ID: " + taskDTO.getAssignedToId()));
            if (!userService.isManagerOf(currentUser, assignedTo) && !assignedTo.getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You cannot assign this task to this user");
            }
            task.setAssignedTo(assignedTo);
        }

        if (taskDTO.getAssignedById() != null) {
            Users assignedBy = userRepository.findById(taskDTO.getAssignedById())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "User not found with ID: " + taskDTO.getAssignedById()));
            task.setAssignedBy(assignedBy);
        } else {
            task.setAssignedBy(currentUser); // Default to current user
        }

        task.setUpdatedAt(LocalDateTime.now());
        taskRepository.save(task);
        return ResponseEntity.ok("Task updated successfully.");
    }

    public Page<Tasks> getAllTasks(Pageable pageable, String status) {
        if (status != null && !status.isEmpty()) {
            return taskRepository.findByStatus(status, pageable);
        }
        return taskRepository.findAll(pageable);
    }
}