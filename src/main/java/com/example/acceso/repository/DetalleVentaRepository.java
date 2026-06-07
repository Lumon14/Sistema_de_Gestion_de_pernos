package com.example.acceso.repository;

import com.example.acceso.model.DetalleVenta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {

    List<DetalleVenta> findByVentaId(Long ventaId);

    // Usamos una consulta nativa que devuelve una lista de mapas (clave-valor)
    @Query(value = "SELECT " +
            "v.id AS idVenta, " +
            "CONCAT(v.tipo_comprobante, ' ', v.serie, '-', v.numero_comprobante) AS numDoc, " +
            "v.fecha AS fecha, " +
            "c.nombre AS cliente, " +
            "u.nombre AS vendedor, " +
            "v.tipo_comprobante AS formaPago, " +
            "d.cantidad AS cantidad, " +
            "d.precio_venta AS precioUnitario, " +
            "d.subtotal AS subtotal, " +
            "v.estado AS estado " +
            "FROM detalles_ventas d " +
            "INNER JOIN ventas v ON d.id_venta = v.id " +
            "LEFT JOIN clientes c ON v.id_cliente = c.id " +
            "LEFT JOIN usuarios u ON v.id_usuario = u.id " +
            "WHERE d.id_producto = :productoId " +
            "ORDER BY v.fecha DESC", nativeQuery = true)
    List<Map<String, Object>> findHistorialVentasPorProductoNative(@Param("productoId") Long productoId);
}