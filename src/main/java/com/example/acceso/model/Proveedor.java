package com.example.acceso.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "proveedores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 20, unique = true)
    private String documento;

    @Column(length = 255)
    private String direccion;

    @Column(length = 50)
    private String telefono;

    @Column(length = 100)
    private String correo;

    @Column(columnDefinition = "integer default 1")
    private Integer estado = 1;
}
