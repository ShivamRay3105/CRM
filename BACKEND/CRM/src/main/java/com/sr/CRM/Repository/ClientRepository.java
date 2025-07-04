package com.sr.CRM.Repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sr.CRM.Model.Client;
import com.sr.CRM.Model.Users;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByAssignedToIn(List<Users> users);

    List<Client> findByAssignedTo(Users user);
    Page<Client> findByAssignedToIn(Iterable<Users> assignedTo, Pageable pageable);

    Page<Client> findByAssignedTo(Users currentUser, Pageable pageable);
}
