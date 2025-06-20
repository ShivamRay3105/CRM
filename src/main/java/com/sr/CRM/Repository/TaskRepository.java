package com.sr.CRM.Repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.Users;

public interface TaskRepository extends JpaRepository<Tasks, Long> {

    List<Tasks> findByLeadId(Long leadId);

    Tasks findByAssignedToId(Long userId);

    List<Tasks> findByAssignedTo(Users user);

    // void deleteByTaskId(Long id);
}
