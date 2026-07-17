package com.example.acceso.repository;

import com.example.acceso.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByEstado(Integer estado);

    List<Venta> findByTipoComprobanteOrderByFechaDesc(String tipoComprobante);

    @Query(value = "SELECT COALESCE(MAX(CAST(numero_comprobante AS INTEGER)), 0) FROM ventas WHERE serie = :serie", nativeQuery = true)
    Integer findMaxNumeroBySerie(@Param("serie") String serie);

    @Query("SELECT v FROM Venta v WHERE v.estado = 1 AND v.id NOT IN " +
           "(SELECT c.venta.id FROM CuentaCobrar c WHERE c.venta IS NOT NULL) ORDER BY v.fecha DESC")
    List<Venta> findSinCuentaCobrar();

    List<Venta> findByFechaBetweenAndEstadoOrderByFechaDesc(java.time.LocalDateTime start, java.time.LocalDateTime end, Integer estado);

    List<Venta> findByFechaBetweenAndMetodoPagoAndEstadoOrderByFechaDesc(java.time.LocalDateTime start, java.time.LocalDateTime end, String metodoPago, Integer estado);

    List<Venta> findByFechaBetweenOrderByFechaDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);

    List<Venta> findByFechaBetweenAndMetodoPagoOrderByFechaDesc(java.time.LocalDateTime start, java.time.LocalDateTime end, String metodoPago);

    List<Venta> findByFechaAfterAndEstadoOrderByFechaDesc(java.time.LocalDateTime start, Integer estado);

    List<Venta> findByFechaAfterAndMetodoPagoAndEstadoOrderByFechaDesc(java.time.LocalDateTime start, String metodoPago, Integer estado);

    @Query("SELECT v FROM Venta v WHERE v.fecha BETWEEN :start AND :end AND v.metodoPago != 'EFECTIVO' ORDER BY v.fecha DESC")
    List<Venta> findByFechaBetweenAndMetodoPagoNotEfectivoOrderByFechaDesc(
            @Param("start") java.time.LocalDateTime start, 
            @Param("end") java.time.LocalDateTime end);

    @Query("SELECT v FROM Venta v WHERE v.fecha BETWEEN :start AND :end AND v.metodoPago != 'EFECTIVO' AND v.estado = :estado ORDER BY v.fecha DESC")
    List<Venta> findByFechaBetweenAndMetodoPagoNotEfectivoAndEstadoOrderByFechaDesc(
            @Param("start") java.time.LocalDateTime start, 
            @Param("end") java.time.LocalDateTime end, 
            @Param("estado") Integer estado);
}
