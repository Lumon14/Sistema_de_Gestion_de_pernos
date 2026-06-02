package com.example.acceso.repository;

import com.example.acceso.model.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    Optional<Cliente> findByDniRuc(String dniRuc);
    java.util.List<Cliente> findByEstado(Integer estado);
}
