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
}
