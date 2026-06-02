package com.example.acceso.repository;

import com.example.acceso.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface VentaRepository extends JpaRepository<Venta, Long> {
    List<Venta> findByEstado(Integer estado);
}
