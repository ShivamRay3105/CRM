package com.sr.CRM.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.Tasks.TaskStatus;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Repository.LeadRepository;
import com.sr.CRM.Repository.TaskRepository;
import com.sr.CRM.Repository.UserRepository;

@Service
public class AnalyticsService {

        @Autowired
        private LeadRepository leadRepository;

        @Autowired
        private TaskRepository taskRepository;

        @Autowired
        private UserService userService;

        @Autowired
        private UserRepository userRepository;

        public Map<String, Object> getEmployeeAnalytics() {
                Users currentUser = userService.getCurrentUser();
                Map<String, Object> analytics = new HashMap<>();
                analytics.put("totalLeads", leadRepository.countByAssignedTo(currentUser));
                analytics.put("totalTasks", taskRepository.countByAssignedTo(currentUser));
                analytics.put("completedTasks",
                                taskRepository.countByAssignedToAndStatus(currentUser, Tasks.TaskStatus.DONE));
                return analytics;
        }

        public Map<String, Object> getManagerAnalytics() {
                Users currentUser = userService.getCurrentUser();
                List<Users> employees = userRepository.findByManager(currentUser);
                long totalLeads = 0;
                long totalTasks = 0;
                long completedTasks = 0;

                for (Users employee : employees) {
                        totalLeads = totalLeads + ((Number) leadRepository.countByAssignedTo(employee)).longValue();
                        totalTasks = totalTasks + ((Number) taskRepository.countByAssignedTo(employee)).longValue();
                        completedTasks = completedTasks + ((Number) taskRepository.countByAssignedToAndStatus(employee,
                                        TaskStatus.DONE)).longValue();
                }

                Map<String, Object> analytics = new HashMap<>();
                analytics.put("totalEmployees", employees.size());
                analytics.put("totalLeads", totalLeads);
                analytics.put("totalTasks", totalTasks);
                analytics.put("completedTasks", completedTasks);
                return analytics;
        }

        public Map<String, Object> getAdminAnalytics() {
                Map<String, Object> analytics = new HashMap<>();
                analytics.put("totalLeads", leadRepository.count());
                analytics.put("totalTasks", taskRepository.count());
                analytics.put("totalUsers", userRepository.count());
                analytics.put("totalClients", userRepository.countByRolesContaining("ROLE_CLIENT"));
                return analytics;
        }
}