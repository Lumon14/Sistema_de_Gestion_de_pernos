package com.example.acceso.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "ventas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cliente")
    private Cliente cliente;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double total;

    @Column(name = "tipo_comprobante", nullable = false, length = 20)
    private String tipoComprobante = "BOLETA";

    @Column(nullable = false, length = 10)
    private String serie = "B001";

    @Column(name = "numero_comprobante", nullable = false, length = 20)
    private String numeroComprobante;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double subtotal = 0.0;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double igv = 0.0;

    @Column(nullable = false, columnDefinition = "integer default 1")
    private Integer estado = 1; // 1: Procesada, 0: Cancelada

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetalleVenta> detalles;

    @PrePersist
    protected void onCreate() {
        this.fecha = LocalDateTime.now();
    }
}
