package com.example.acceso.repository;

import com.example.acceso.model.CajaSesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CajaSesionRepository extends JpaRepository<CajaSesion, Long> {
    Optional<CajaSesion> findFirstByEstadoOrderByIdDesc(String estado);
    List<CajaSesion> findAllByOrderByFechaAperturaDesc();
}
