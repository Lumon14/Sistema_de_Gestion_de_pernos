package com.example.acceso.repository;

import com.example.acceso.model.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {
    List<Pedido> findByEstado(String estado);
    long countByEstado(String estado);
}
