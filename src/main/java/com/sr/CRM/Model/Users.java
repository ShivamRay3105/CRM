package com.sr.CRM.Model;

import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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

    private String name;
    private String email;
    private double phone_number;
    private String address;
    private String username;
    private String password;
    private String position;
    private String department;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles")
    private Set<String> roles;

    @Override
    public String toString() {
        return "User [id=" + id + ", name=" + name + ", email=" + email + ", phone_number=" + phone_number
                + ", address=" + address + ", username=" + username + ", password=" + password 
                + ", position=" + position + ", department=" + department + ", getId()=" + getId() + ", getName()="
                + getName() + ", getEmail()=" + getEmail() + ", getPhone_number()=" + getPhone_number()
                + ", getAddress()=" + getAddress() + ", getUsername()=" + getUsername() + ", getClass()=" + getClass()
                + ", getPassword()=" + getPassword() + ", getRole()="  + getPosition()
                + ", getDepartment()=" + getDepartment() + ", hashCode()=" + hashCode() + ", toString()="
                + super.toString() + "]";
    }

}