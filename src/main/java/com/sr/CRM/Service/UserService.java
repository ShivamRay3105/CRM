package com.sr.CRM.Service;

import java.util.HashSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sr.CRM.Model.Users;
import com.sr.CRM.Repository.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public Users add(Users user) {
        Set<String> roles = new HashSet<>();
        roles.add("ROLE_USER");
        user.setRoles(roles);
        return userRepository.save(user);
    }

    public Users findUserById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

}
