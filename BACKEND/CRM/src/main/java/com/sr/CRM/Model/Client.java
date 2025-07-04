package com.sr.CRM.Model;

import java.time.LocalDateTime;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "clients")
public class Client {

    public enum ClientStatus {
        ACTIVE,
        INACTIVE,
        ON_HOLD,
        CLOSED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @Pattern(regexp = "^[0-9]{10}$")
    private String phone;

    private String company;
    private String address;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "assigned_to")
    private Users assignedTo;

    @Enumerated(EnumType.STRING)
    private ClientStatus status;

}