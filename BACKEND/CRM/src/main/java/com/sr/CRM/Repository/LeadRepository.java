package com.sr.CRM.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.Users;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedTo(Users user);

    Optional<Lead> findByName(String name);

    Lead findByAssignedToId(Long userId);

    List<Lead> findByAssignedToIn(List<Users> users);

    Page<Lead> findByAssignedTo(Users user, Pageable pageable);

    Object countByAssignedTo(Users currentUser);

    Page<Lead> findByStatus(Lead.LeadStatus status, Pageable pageable);

    List<Lead> findByAssignedToAndConversionStatus(Users assignedTo, String conversionStatus);

}
