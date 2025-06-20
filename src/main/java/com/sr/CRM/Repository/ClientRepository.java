package com.sr.CRM.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.sr.CRM.Model.Client;

@Repository
public interface ClientRepository extends JpaRepository<Client,Long> {
    
}
