package com.sr.CRM.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

        private final PasswordEncoder passwordEncoder;

        UserController(PasswordEncoder passwordEncoder) {
                this.passwordEncoder = passwordEncoder;
        }

        @GetMapping("/me")
        public ResponseEntity<?> getCurrentUser(
                        @AuthenticationPrincipal org.springframework.security.core.userdetails.User user) {
                String role = user.getAuthorities().stream()
                                .findFirst()
                                .map(GrantedAuthority::getAuthority)
                                .map(r -> r.replace("ROLE_", "")) // optional: remove prefix
                                .orElse("UNKNOWN");

                return ResponseEntity.ok(Map.of(
                                "username", user.getUsername(),
                                "role", "ROLE_" + role // 👈 if frontend expects full "ROLE_EMPLOYEE"
                ));
        }

}
