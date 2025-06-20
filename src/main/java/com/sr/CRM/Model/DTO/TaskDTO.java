package com.sr.CRM.Model.DTO;

import lombok.Data;
import java.time.LocalDateTime;

import com.sr.CRM.Model.Tasks.TaskStatus;

@Data
public class TaskDTO {

    private Long taskId;
    private Long leadId;

    private String title;
    private String description;
    private LocalDateTime dueDate;
    private Long assignedToId;
    private TaskStatus status;

}