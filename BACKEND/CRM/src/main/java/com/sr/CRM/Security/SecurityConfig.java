package com.sr.CRM.Security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    private final UserDetailsService userDetailsService;

    public SecurityConfig(UserDetailsService userDetailsService) {
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        return new ProviderManager(daoAuthenticationProvider());
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .securityContext(context -> context.requireExplicitSave(false))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/users/me").authenticated()
                        .requestMatchers("/api/auth/change-password").authenticated()

                        // Admin-only endpoints
                        .requestMatchers("/api/admin/addEmployee").hasRole("ADMIN")
                        .requestMatchers("/api/admin/addManager").hasRole("ADMIN")
                        .requestMatchers("/api/admin/addAdmin").hasRole("ADMIN")
                        .requestMatchers("/api/admin/updateEmployee/{id}").hasRole("ADMIN")
                        .requestMatchers("/api/admin//deleteEmployee/{id}").hasRole("ADMIN")
                        .requestMatchers("/api/admin/user/{id}").hasRole("ADMIN")
                        .requestMatchers("/api/admin/allLeads").hasRole("ADMIN")
                        .requestMatchers("/api/admin/allTasks").hasRole("ADMIN")
                        .requestMatchers("/api/admin/getAllEmployees").hasRole("ADMIN")
                        .requestMatchers("/api/admin/allLeads").hasRole("ADMIN")
                        .requestMatchers("/api/Tasks/admin/updateTask/{id}").hasRole("ADMIN")
                        .requestMatchers("/api/Leads/admin/updateLead/{id}").hasRole("ADMIN")
                        .requestMatchers("/api/analytics/admin").hasRole("ADMIN")

                        // Employee and Manager endpoints
                        .requestMatchers("/api/Tasks/addTask").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Tasks/myTasks").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Tasks/getTask/{id}").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Tasks/TaskUpdate/{id}").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Leads/addLead").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Leads/myLeads").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Leads/getLead/{id}").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Leads/updateLead/{id}").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/analytics/summary").hasAnyRole("EMPLOYEE", "MANAGER")

                        // Manager-only endpoints
                        .requestMatchers("/api/Leads/approve/{id}").hasRole("MANAGER")
                        .requestMatchers("/api/Leads/pending").hasRole("MANAGER")
                        .requestMatchers("/api/Manager/updateLeads/{id}").hasRole("MANAGER")
                        .requestMatchers("/api/Manager/allLeadsOfEmployees").hasRole("MANAGER")
                        .requestMatchers("/api/Manager/allTasksOfEmployees").hasRole("MANAGER")
                        .requestMatchers("/api/Manager/updateEmployeeTask/{id}").hasRole("MANAGER")
                        .requestMatchers("/api/Manager/employees").hasRole("MANAGER")
                        .requestMatchers("/api/analytics/manager").hasRole("MANAGER")

                        // Employee, Manager, and Admin endpoints
                        .requestMatchers("/api/Leads/deleteLead/{id}").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")
                        .requestMatchers("/api/Tasks/deleteTask/{id}").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")

                        // Manager and Employee enpoints
                        .requestMatchers("/api/Leads/convert/{id}").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")

                        // Client endpoints
                        .requestMatchers("/api/clients/Manager/allClientsOfEmployees").hasRole("MANAGER")
                        .requestMatchers("/api/clients/Employee/allClients").hasRole("EMPLOYEE")
                        .requestMatchers("/api/admin/getAllClients").hasRole("ADMIN")
                        .requestMatchers("/api/Manager/updateClient/{id}").hasRole("MANAGER")
                        .requestMatchers("/api/Manager/deleteClient/{id}").hasRole("MANAGER")

                        // Future client endpoints (placeholder)
                        .requestMatchers("/api/Clients/myClients").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Clients/addClient").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Clients/update/{id}").hasAnyRole("EMPLOYEE", "MANAGER")
                        .requestMatchers("/api/Clients/delete/{id}").hasAnyRole("EMPLOYEE", "MANAGER", "ADMIN")
                        .requestMatchers("/api/Clients/admin/updateClient/{id}").hasRole("ADMIN")

                        // Deny all other requests
                        .anyRequest().denyAll());
        return http.build();
    }
}