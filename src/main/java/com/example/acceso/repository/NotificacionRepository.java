package com.example.acceso.repository;

import com.example.acceso.model.Notificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

    List<Notificacion> findTop50ByUsuarioIdOrderByFechaCreacionDesc(Long usuarioId);

    long countByUsuarioIdAndLeidaFalse(Long usuarioId);

    boolean existsByTipoAndPedidoIdAndUsuarioIdAndLeidaFalse(String tipo, Long pedidoId, Long usuarioId);

    boolean existsByTipoAndProductoIdAndUsuarioIdAndLeidaFalse(String tipo, Long productoId, Long usuarioId);

    boolean existsByTipoAndCuentaCobrarIdAndUsuarioIdAndLeidaFalse(String tipo, Long cuentaCobrarId, Long usuarioId);

    boolean existsByTipoAndCuentaPagarIdAndUsuarioIdAndLeidaFalse(String tipo, Long cuentaPagarId, Long usuarioId);
}
