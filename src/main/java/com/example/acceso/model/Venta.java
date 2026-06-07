package com.example.acceso.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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
    private String tipoComprobante = TipoComprobanteVenta.NOTA;

    @Column(nullable = false, length = 10)
    private String serie = "NV001";

    @Column(name = "numero_comprobante", nullable = false, length = 20)
    private String numeroComprobante;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double subtotal = 0.0;

    @Column(nullable = false, columnDefinition = "NUMERIC(10,2)")
    private Double igv = 0.0;

    /** 1 = vigente, 0 = anulada/cancelada (compatibilidad) */
    @Column(nullable = false, columnDefinition = "integer default 1")
    private Integer estado = 1;

    /** PENDIENTE | CANJEADA | ANULADA (notas) | EMITIDA (boleta/factura) */
    @Column(name = "estado_documento", length = 20)
    private String estadoDocumento;

    /** No serializar: referencia circular con notaOrigen y no se usa en listados. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comprobante_canje_id")
    @JsonIgnore
    private Venta comprobanteCanje;

    /** No serializar: referencia circular con comprobanteCanje y no se usa en listados. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nota_origen_id")
    @JsonIgnore
    private Venta notaOrigen;

    /** Si false, no descuenta stock ni genera kardex (canje de nota) */
    @Column(name = "afecta_inventario", nullable = false)
    private Boolean afectaInventario = true;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<DetalleVenta> detalles;

    @PrePersist
    protected void onCreate() {
        this.fecha = LocalDateTime.now();
    }
}
