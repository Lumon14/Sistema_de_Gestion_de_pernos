package com.example.acceso.repository;

import com.example.acceso.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Métodos para encontrar usuarios por sus propiedades únicas
    Optional<Usuario> findByUsuario(String usuario);

    Optional<Usuario> findByCorreo(String correo);

    // Métodos para verificar la existencia de usuarios
    boolean existsByUsuario(String usuario);

    boolean existsByCorreo(String correo);

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    boolean existsByUsuarioAndIdNot(String usuario, Long id);

    boolean existsByCorreoAndIdNot(String correo, Long id);

    // Métodos para el borrado lógico
    List<Usuario> findAllByEstadoNot(Integer estado);

    long countByEstadoNot(Integer estado);

    List<Usuario> findByEstado(Integer estado);
}