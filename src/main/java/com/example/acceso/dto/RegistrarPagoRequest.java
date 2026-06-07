package com.example.acceso.dto;

import lombok.Data;

@Data
public class RegistrarPagoRequest {
    private Double monto;
    private String metodoPago;
}
