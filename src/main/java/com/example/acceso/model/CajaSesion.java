package com.example.acceso.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "caja_sesion")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CajaSesion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "fecha_apertura", nullable = false)
    private LocalDateTime fechaApertura;

    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;

    @Column(name = "monto_apertura", nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double montoApertura;

    @Column(name = "monto_cierre", columnDefinition = "NUMERIC(10,2)")
    private Double montoCierre;

    @Column(nullable = false, length = 20)
    private String estado = "ABIERTA"; // ABIERTA | CERRADA

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario_apertura", nullable = false)
    private Usuario usuarioApertura;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario_cierre")
    private Usuario usuarioCierre;
}
