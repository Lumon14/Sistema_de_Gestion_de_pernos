package com.example.acceso.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "detalles_ventas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DetalleVenta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_venta")
    @JsonIgnore
    private Venta venta;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_producto")
    private Producto producto;

    @Column(nullable = false)
    private Integer cantidad;

    @Column(nullable = false, name = "precio_venta", columnDefinition = "NUMERIC(10,2)")
    private Double precioVenta;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2) DEFAULT 0.00")
    private Double descuento = 0.0;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double subtotal;
}
