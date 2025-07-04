package com.sr.CRM.Model.DTO;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ConversionRequestDTO {
    @JsonProperty("message")
    private String message;
}