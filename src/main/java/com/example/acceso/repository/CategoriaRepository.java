package com.example.acceso.repository;

import com.example.acceso.model.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByEstado(Integer estado);

    // Busca todas las categorías que no tienen el estado especificado (para exclusión de eliminadas con estado = 2)
    List<Categoria> findAllByEstadoNot(Integer estado);
}

