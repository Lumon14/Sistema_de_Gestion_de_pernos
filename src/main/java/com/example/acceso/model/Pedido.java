package com.example.acceso.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pedidos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fecha;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_cliente", nullable = false)
    private Cliente cliente;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double total;

    @Column(nullable = false, length = 20)
    private String estado = "PENDIENTE"; // PENDIENTE, COMPLETADO, CANCELADO

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetallePedido> detalles;

    @PrePersist
    protected void onCreate() {
        this.fecha = LocalDateTime.now();
    }
}
