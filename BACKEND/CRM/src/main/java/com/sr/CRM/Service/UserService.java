package com.sr.CRM.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.sr.CRM.Exception.ResourceNotFoundException;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.DTO.UserDTO;
import com.sr.CRM.Repository.UserRepository;

import jakarta.transaction.Transactional;

@Service
public class UserService {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    public UserService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Users addEmployee(UserDTO userDTO, Set<String> roles) {
        try {
            if (userRepository.existsByUsername(userDTO.getUsername())) {
                throw new RuntimeException("Username already exists: " + userDTO.getUsername());
            }
            if (userRepository.existsByEmail(userDTO.getEmail())) {
                throw new RuntimeException("Email already exists: " + userDTO.getEmail());
            }
            if (userRepository.existsByPhoneNumber(userDTO.getPhoneNumber())) {
                throw new RuntimeException("Phone number already exists: " + userDTO.getPhoneNumber());
            }

            Users user = new Users();
            if (userDTO.getManagerId() != null) {
                Users manager = userRepository.findById(userDTO.getManagerId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Manager not found with ID: " + userDTO.getManagerId()));
                user.setManager(manager);
            }

            user.setName(userDTO.getName());
            user.setEmail(userDTO.getEmail());
            user.setPhoneNumber(userDTO.getPhoneNumber());
            user.setAddress(userDTO.getAddress());
            user.setUsername(userDTO.getUsername());
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            user.setPosition(userDTO.getPosition());
            user.setDepartment(userDTO.getDepartment());
            user.setRoles(roles);

            return userRepository.save(user);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error adding Employee: " + e.getMessage());
        }
    }

    @Transactional
    public Users addAdmin(UserDTO userDTO, Set<String> roles) {
        try {
            if (userRepository.existsByUsername(userDTO.getUsername())) {
                throw new RuntimeException("Username already exists: " + userDTO.getUsername());
            }
            if (userRepository.existsByEmail(userDTO.getEmail())) {
                throw new RuntimeException("Email already exists: " + userDTO.getEmail());
            }
            if (userRepository.existsByPhoneNumber(userDTO.getPhoneNumber())) {
                throw new RuntimeException("Phone number already exists: " + userDTO.getPhoneNumber());
            }

            Users user = new Users();
            user.setName(userDTO.getName());
            user.setEmail(userDTO.getEmail());
            user.setPhoneNumber(userDTO.getPhoneNumber());
            user.setAddress(userDTO.getAddress());
            user.setUsername(userDTO.getUsername());
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
            user.setPosition(userDTO.getPosition());
            user.setDepartment(userDTO.getDepartment());
            user.setRoles(roles);

            return userRepository.save(user);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error adding admin: " + e.getMessage());
        }
    }

    public Users findById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
    }

    public Users getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
    }

    public boolean isManagerOf(Users manager, Users employee) {
        return employee.getManager() != null && employee.getManager().getId().equals(manager.getId());
    }

    public List<Users> getEmployeesUnderManager(Users manager) {
        return userRepository.findByManager(manager);
    }

    // In UserService.java
    public List<Map<String, Object>> getEmployees() {
        Users currentUser = getCurrentUser();
        if (!currentUser.getRoles().contains("ROLE_MANAGER")) {
            throw new RuntimeException("Access denied: only managers can view employees.");
        }
        List<Users> employees = userRepository.findByManager(currentUser);
        return employees.stream().map(emp -> {
            Map<String, Object> empMap = new HashMap<>();
            empMap.put("id", emp.getId());
            empMap.put("name", emp.getName());
            return empMap;
        }).collect(Collectors.toList());
    }

    public List<Users> getAllEmployees() {
        // return userRepository.findByRolesContains("ROLE_EMPLOYEE");
        return userRepository.findAll();
    }

    public List<Users> getTeamMembers(Users currentUser) {
        if (!currentUser.getRoles().contains("ROLE_MANAGER")) {
            throw new RuntimeException("Access denied: only managers can view team members.");
        }
        return userRepository.findByManager(currentUser);
    }

    // @Transactional
    // public ResponseEntity<String> updateEmployee(Long id, Users updatedEmployee,
    // Authentication authentication) {
    // Users client = userRepository.findById(id)
    // .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID:
    // " + id));

    // if (updatedEmployee.getName() != null)
    // client.setName(updatedEmployee.getName());
    // if (updatedEmployee.getEmail() != null)
    // client.setEmail(updatedEmployee.getEmail());
    // if (updatedEmployee.getPhoneNumber() != null)
    // client.setPhoneNumber(updatedEmployee.getPhoneNumber());
    // if (updatedEmployee.getUsername() != null)
    // client.setUsername(updatedEmployee.getUsername());
    // if (updatedEmployee.getPosition() != null)
    // client.setPosition(updatedEmployee.getPosition());
    // if (updatedEmployee.getAddress() != null)
    // client.setAddress(updatedEmployee.getAddress());
    // if (updatedEmployee.getDepartment() != null)
    // client.setDepartment(updatedEmployee.getDepartment());
    // if (updatedEmployee.getManager() != null)
    // client.setManager(updatedEmployee.getManager());
    // userRepository.save(client);
    // return ResponseEntity.ok("Employee updated successfully");
    // }

    // @Transactional
    // public ResponseEntity<String> deleteEmployee(Long id) {
    // try {
    // if (!userRepository.existsById(id)) {
    // return ResponseEntity.status(HttpStatus.NOT_FOUND)
    // .body("Client not found with ID: " + id);
    // }

    // userRepository.deleteById(id);
    // return ResponseEntity.ok("Client deleted successfully");

    // } catch (EmptyResultDataAccessException e) {
    // return ResponseEntity.status(HttpStatus.NOT_FOUND)
    // .body("Client not found with ID: " + id);
    // } catch (DataIntegrityViolationException e) {
    // return ResponseEntity.status(HttpStatus.CONFLICT)
    // .body("Cannot delete client due to existing references");
    // } catch (Exception e) {
    // return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
    // .body("Error deleting client: " + e.getMessage());
    // }
    // }

    @Transactional
    public ResponseEntity<String> updateEmployee(Long id, Users updatedEmployee, Authentication authentication) {
        try {
            // Verify admin role
            // if (!authentication.getAuthorities().contains(new
            // SimpleGrantedAuthority("ROLE_ADMIN"))) {
            // throw new AccessDeniedException("Only admins can update employees");
            // }

            // Fetch existing employee
            Users employee = userRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found with ID: " + id));

            // Validate required fields
            // if (updatedEmployee.getName() == null || updatedEmployee.getName().isBlank()
            // ||
            // updatedEmployee.getEmail() == null || updatedEmployee.getEmail().isBlank() ||
            // updatedEmployee.getUsername() == null ||
            // updatedEmployee.getUsername().isBlank() ||
            // updatedEmployee.getPosition() == null ||
            // updatedEmployee.getPosition().isBlank() ||
            // updatedEmployee.getDepartment() == null ||
            // updatedEmployee.getDepartment().isBlank()) {
            // return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            // .body("Name, email, username, position, and department are required");
            // }

            // Validate email format

            // Check for duplicate email
            if (!employee.getEmail().equals(updatedEmployee.getEmail()) &&
                    userRepository.existsByEmail(updatedEmployee.getEmail())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Email already in use");
            }

            // Check for duplicate username
            if (!employee.getUsername().equals(updatedEmployee.getUsername()) &&
                    userRepository.existsByUsername(updatedEmployee.getUsername())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Username already in use");
            }

            // Update fields
            // employee.setName(updatedEmployee.getName());
            // employee.setEmail(updatedEmployee.getEmail());
            // employee.setPhoneNumber(updatedEmployee.getPhoneNumber());
            // employee.setAddress(updatedEmployee.getAddress());
            // employee.setUsername(updatedEmployee.getUsername());
            // employee.setPosition(updatedEmployee.getPosition());
            // employee.setDepartment(updatedEmployee.getDepartment());
            // employee.setManager(updatedEmployee.getManager());

            if (updatedEmployee.getName() != null)
                employee.setName(updatedEmployee.getName());
            if (updatedEmployee.getEmail() != null) {
                if (!isValidEmail(updatedEmployee.getEmail())) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Invalid email format");
                }
                employee.setEmail(updatedEmployee.getEmail());
            }
            if (updatedEmployee.getPhoneNumber() != null)
                employee.setPhoneNumber(updatedEmployee.getPhoneNumber());
            if (updatedEmployee.getUsername() != null)
                employee.setUsername(updatedEmployee.getUsername());
            if (updatedEmployee.getPosition() != null)
                employee.setPosition(updatedEmployee.getPosition());
            if (updatedEmployee.getAddress() != null)
                employee.setAddress(updatedEmployee.getAddress());
            if (updatedEmployee.getDepartment() != null)
                employee.setDepartment(updatedEmployee.getDepartment());
            if (updatedEmployee.getManager() != null)
                employee.setManager(updatedEmployee.getManager());

            userRepository.save(employee);
            return ResponseEntity.ok("Employee updated successfully");
        } catch (DataIntegrityViolationException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Error: Email or username already exists: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error updating employee: " + e.getMessage());
        }
    }

    @Transactional
    public ResponseEntity<String> deleteEmployee(Long id) {
        try {
            if (!userRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Employee not found with ID: " + id);
            }

            // Delete related records to avoid foreign key constraints
            userRepository.deleteById(id); // Adjust based on actual related tables
            return ResponseEntity.ok("Employee deleted successfully");
        } catch (DataIntegrityViolationException e) {
            e.printStackTrace();
            String message = e.getRootCause() != null ? e.getRootCause().getMessage() : e.getMessage();
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete employee due to existing references (e.g., projects or timesheets): "
                            + message);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting employee: " + e.getMessage());
        }
    }

    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$");
    }

}