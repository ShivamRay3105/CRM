package com.sr.CRM.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sr.CRM.Model.Lead;
import com.sr.CRM.Model.Users;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {
    List<Lead> findByAssignedTo(Users user);

    Optional<Lead> findByName(String name);

    Lead findByAssignedToId(Long userId);

    // void deleteByLeadId(Long id);

}
