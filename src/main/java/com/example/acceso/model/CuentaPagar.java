package com.example.acceso.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cuentas_pagar")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CuentaPagar {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @Column(name = "monto_total", nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double montoTotal;

    @Column(name = "saldo_pendiente", nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double saldoPendiente;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE";
}
