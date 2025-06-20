package com.sr.CRM.Controller;

import com.sr.CRM.Model.Users;
import com.sr.CRM.Service.UserService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/addEmployee")
    public Users addEmployee(@RequestBody Users user) {
        return userService.add(user);
    }

}
