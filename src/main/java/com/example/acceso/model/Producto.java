package com.example.acceso.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "productos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_categoria")
    private Categoria categoria;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_proveedor")
    private Proveedor proveedor;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double precioVenta;

    @Column(columnDefinition = "NUMERIC(10,2)")
    private Double precioCompra;

    @Column(columnDefinition = "integer default 0")
    private Integer stock;

    @Column(name = "stock_minimo", columnDefinition = "integer default 0")
    private Integer stockMinimo;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @Column(length = 255)
    private String imagen;

    @Column(name = "fecha_registro", updatable = false)
    private java.time.LocalDateTime fechaRegistro;

    @Column(columnDefinition = "integer default 1")
    private Integer estado = 1;

    @PrePersist
    protected void onCreate() {
        fechaRegistro = java.time.LocalDateTime.now();
    }
}