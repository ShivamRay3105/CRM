package com.sr.CRM.Controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sr.CRM.Model.Users;
import com.sr.CRM.Model.DTO.ChangePasswordRequestDTO;
import com.sr.CRM.Repository.UserRepository;

import jakarta.transaction.Transactional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            String username = credentials.get("username");
            String password = credentials.get("password");
            if (username == null || password == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Username or password missing"));
            }
            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
            SecurityContextHolder.getContext().setAuthentication(auth);
            return ResponseEntity.ok(Map.of("message", "Login successful", "username", username));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Server error: " + e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    @Transactional
    public ResponseEntity<?> changePassword(@RequestBody ChangePasswordRequestDTO request) {
        try {
            // Get the authenticated user's username
            String principal = SecurityContextHolder.getContext().getAuthentication().getName();
            System.out.println("Attempting to change password for: " + principal);

            if (principal == null || principal.isEmpty()) {
                return ResponseEntity.status(401).body("User not authenticated");
            }

            // Find user by username
            Users user = userRepository.findByUsername(principal)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Verify old password
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                return ResponseEntity.badRequest().body("Invalid old password");
            }

            // Validate new password
            if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
                return ResponseEntity.badRequest().body("New password must be at least 8 characters long");
            }

            // Update only password using JPQL
            String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
            userRepository.updatePasswordByUsername(encodedNewPassword, principal);

            System.out.println("Password updated successfully for: " + principal);
            return ResponseEntity.ok("Password changed successfully");

        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body("Error changing password: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Unexpected error: " + e.getMessage());
        }
    }

}
