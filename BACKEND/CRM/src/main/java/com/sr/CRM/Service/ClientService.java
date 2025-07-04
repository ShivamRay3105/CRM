package com.sr.CRM.Service;

import com.sr.CRM.Exception.ResourceNotFoundException;
import com.sr.CRM.Model.Client;
import com.sr.CRM.Model.Users;
import com.sr.CRM.Repository.ClientRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private UserService userService;

    public Page<Client> getEmployeeClients(Pageable pageable) {
        Users currentUser = userService.getCurrentUser();
        Page<Client> clientPage = clientRepository.findByAssignedTo(currentUser, pageable);
        return clientPage;
    }

    public Page<Client> getTeamClients(Pageable pageable) {
        Users currentUser = userService.getCurrentUser();
        List<Users> teamMembers = userService.getTeamMembers(currentUser);
        return clientRepository.findByAssignedToIn(teamMembers, pageable);
    }

    public List<Client> getAllClients() {
        return clientRepository.findAll();
    }

    // @Transactional
    public ResponseEntity<String> updateClient(Long id, Client updatedClient, Authentication authentication) {
        Client client = clientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with ID: " + id));

        if (updatedClient.getName() != null)
            client.setName(updatedClient.getName());
        if (updatedClient.getEmail() != null)
            client.setEmail(updatedClient.getEmail());
        if (updatedClient.getPhone() != null)
            client.setPhone(updatedClient.getPhone());
        if (updatedClient.getCompany() != null)
            client.setCompany(updatedClient.getCompany());
        if (updatedClient.getStatus() != null)
            client.setStatus(updatedClient.getStatus());
        if (updatedClient.getAddress() != null)
            client.setAddress(updatedClient.getAddress());
        clientRepository.save(client);
        return ResponseEntity.ok("Client updated successfully");
    }

    public ResponseEntity<String> deleteClient(Long id) {
        try {
            if (!clientRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Client not found with ID: " + id);
            }

            clientRepository.deleteById(id);
            return ResponseEntity.ok("Client deleted successfully");

        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Client not found with ID: " + id);
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Cannot delete client due to existing references");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting client: " + e.getMessage());
        }
    }

}