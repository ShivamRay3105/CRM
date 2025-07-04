package com.sr.CRM.Model.DTO;

import lombok.Data;

@Data
public class ResetPasswordRequestDTO {
     private String token;
    private String newPassword;
}
