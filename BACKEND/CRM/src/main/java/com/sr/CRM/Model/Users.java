package com.sr.CRM.Model;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "employees")
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 2, max = 100)
    private String name;

    @Email
    @NotBlank
    @Column(unique = true)
    private String email;

    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    @Column(unique = true)
    private String phoneNumber;

    @NotBlank
    private String address;

    @NotBlank
    @Size(min = 4)
    private String username;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    private String position;

    @NotBlank
    private String department;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "users_id"))
    @Column(name = "roles")
    private Set<String> roles;

    @ManyToOne
    @JoinColumn(name = "manager_id", nullable = true)
    private Users manager;

    @OneToMany(mappedBy = "manager")
    @JsonIgnore
    private List<Users> employees = new ArrayList<>();

}