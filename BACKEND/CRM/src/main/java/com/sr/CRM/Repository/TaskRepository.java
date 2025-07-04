package com.sr.CRM.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.sr.CRM.Model.Tasks;
import com.sr.CRM.Model.Tasks.TaskStatus;
import com.sr.CRM.Model.Users;

public interface TaskRepository extends JpaRepository<Tasks, Long> {

    List<Tasks> findByLeadId(Long leadId);

    Tasks findByAssignedToId(Long userId);

    List<Tasks> findByAssignedTo(Users user);

    List<Tasks> findByAssignedToIn(List<Users> users);

    Page<Tasks> findByAssignedTo(Users user, Pageable pageable);

    Object countByAssignedTo(Users currentUser);

    Object countByAssignedToAndStatus(Users currentUser, TaskStatus done);

    Page<Tasks> findByStatus(String status, Pageable pageable);

    Page<Tasks> findByStatusAndAssignedToNotNull(String status, Pageable pageable);

    Page<Tasks> findAllByAssignedToNotNull(Pageable pageable);

    Page<Tasks> findByAssignedToIn(List<Users> assignedTo, Pageable pageable);

    Page<Tasks> findByAssignedToInAndStatus(List<Users> assignedTo, String status, Pageable pageable);
}
