package com.example.acceso.repository;

import com.example.acceso.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByEstado(Integer estado);

    @Query(value = "SELECT p.id, p.nombre, p.precio_venta, p.stock, p.estado, p.imagen, p.stock_minimo, " +
            "COALESCE(SUM(dv.cantidad), 0) as unidades_vendidas, " +
            "COALESCE(SUM(dv.subtotal), 0.0) as total_ventas " +
            "FROM public.productos p " +
            "LEFT JOIN public.detalles_ventas dv ON p.id = dv.id_producto " +
            "GROUP BY p.id, p.nombre, p.precio_venta, p.stock, p.estado, p.imagen, p.stock_minimo " +
            "ORDER BY p.id DESC", nativeQuery = true)
    List<Map<String, Object>> listarProductosConTotalesDeVenta();

    @Query(value = "SELECT v.fecha, v.tipo_comprobante, v.serie, v.numero_comprobante, " +
            "dv.cantidad, dv.precio_venta, dv.subtotal " +
            "FROM public.detalles_ventas dv " +
            "INNER JOIN public.ventas v ON dv.id_venta = v.id " +
            "WHERE dv.id_producto = :idProducto " +
            "ORDER BY v.fecha DESC", nativeQuery = true)
    List<Map<String, Object>> obtenerHistorialDeVentasPorProducto(@Param("idProducto") Long idProducto);
}