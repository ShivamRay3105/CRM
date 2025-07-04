package com.sr.CRM.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.sr.CRM.Model.Users;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phone_number); // Maps to phone_number column via @Column

    Optional<Users> findByUsername(String username);

    List<Users> findByManager(Users manager);

    Long countByRolesContaining(String string);

    List<Users> findByRolesContains(String string);

    List<Users> findByRolesContaining(String role);

    Optional<Users> findByEmail(String email);

    Optional<Users> findByUsernameAndEmail(String username, String email);

    @Modifying
    @Query("UPDATE Users u SET u.password = :password WHERE u.username = :username")
    void updatePasswordByUsername(@Param("password") String password, @Param("username") String username);
}
