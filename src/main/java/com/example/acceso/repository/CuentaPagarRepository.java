package com.example.acceso.repository;

import com.example.acceso.model.CuentaPagar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CuentaPagarRepository extends JpaRepository<CuentaPagar, Long> {

    List<CuentaPagar> findAllByOrderByIdDesc();

    List<CuentaPagar> findByEstadoInOrderByIdDesc(List<String> estados);
}
