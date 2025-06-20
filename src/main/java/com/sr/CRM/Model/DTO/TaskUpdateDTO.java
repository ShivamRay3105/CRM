package com.sr.CRM.Model.DTO;

import java.time.LocalDateTime;

import com.sr.CRM.Model.Tasks.TaskStatus;

import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskUpdateDTO {

    private String description;

    @Enumerated(jakarta.persistence.EnumType.STRING)
    private TaskStatus status;

    private String title;
    private LocalDateTime dueDate;
    private Long assignedToId;


}
