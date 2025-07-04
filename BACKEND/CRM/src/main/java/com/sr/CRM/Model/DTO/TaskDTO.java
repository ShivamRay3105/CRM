
package com.sr.CRM.Model.DTO;

import com.sr.CRM.Model.Tasks.TaskStatus;

import lombok.Data;

import com.sr.CRM.Model.Tasks.TaskPriority;
import java.time.LocalDateTime;

@Data
public class TaskDTO {
    private Long leadId;
    private String title;
    private String description;
    private LocalDateTime dueDate;
    private TaskStatus status;
    private TaskPriority priority;
    private Long assignedToId;
    private Long assignedById;

}