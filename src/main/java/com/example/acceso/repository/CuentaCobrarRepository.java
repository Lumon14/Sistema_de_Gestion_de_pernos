package com.example.acceso.repository;

import com.example.acceso.model.CuentaCobrar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CuentaCobrarRepository extends JpaRepository<CuentaCobrar, Long> {

    List<CuentaCobrar> findAllByOrderByIdDesc();

    Optional<CuentaCobrar> findByVentaId(Long ventaId);

    List<CuentaCobrar> findByEstadoInOrderByIdDesc(List<String> estados);
}
