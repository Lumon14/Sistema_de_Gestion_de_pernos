package com.example.acceso.repository;

import com.example.acceso.model.Perfil;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerfilRepository extends JpaRepository<Perfil, Long> {
    // Busca todos los perfiles que están activos (estado = 1)
    List<Perfil> findByEstado(Integer estado);

    // Busca todos los perfiles que no tienen el estado especificado (para exclusión de eliminados con estado = 2)
    List<Perfil> findAllByEstadoNot(Integer estado);
}