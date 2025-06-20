package com.sr.CRM.Model;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;
    private String phone;
    private String company;
    private String address; // Optional: filled later or "N/A"

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private Users assignedTo;

}