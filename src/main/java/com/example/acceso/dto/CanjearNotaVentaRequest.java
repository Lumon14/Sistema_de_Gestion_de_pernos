package com.example.acceso.dto;

import lombok.Data;

@Data
public class CanjearNotaVentaRequest {
    /** BOLETA o FACTURA */
    private String tipoDestino;
    private Long clienteId;
    private String dniRuc;
    private String nombre;
    private String telefono;
    private String email;
    private String direccion;
    
    private Boolean pagarCuotas;
    private java.util.List<CuotaDTO> cuotas;

    @Data
    public static class CuotaDTO {
        private Double monto;
        private String fechaPago; // yyyy-MM-dd
    }
}
