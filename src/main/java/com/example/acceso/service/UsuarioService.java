package com.example.acceso.service;

import com.example.acceso.model.Usuario;
import com.example.acceso.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<Usuario> listarUsuarios() {
        // Excluimos a los usuarios con estado 2 (eliminados lógicamente)
        // Nota: Necesitarás crear este método en tu UsuarioRepository.
        // Ejemplo: List<Usuario> findAllByEstadoNot(Integer estado);
        return usuarioRepository.findAllByEstadoNot(2);
    }

    @Transactional
    public Usuario guardarUsuario(Usuario usuario) {
        try {
            // Validaciones adicionales
            if (usuario.getNombre() == null || usuario.getNombre().trim().isEmpty()) {
                throw new IllegalArgumentException("El nombre es obligatorio");
            }

            if (usuario.getUsuario() == null || usuario.getUsuario().trim().isEmpty()) {
                throw new IllegalArgumentException("El usuario es obligatorio");
            }

            if (!usuario.getNombre().trim().matches("^[a-zA-Z]+$")) {
                throw new IllegalArgumentException("El nombre solo puede contener letras mayúsculas y minúsculas");
            }

            if (!usuario.getUsuario().trim().matches("^[a-zA-Z]+$")) {
                throw new IllegalArgumentException("El usuario solo puede contener letras mayúsculas y minúsculas");
            }

            if (usuario.getCorreo() == null || usuario.getCorreo().trim().isEmpty()) {
                throw new IllegalArgumentException("El correo es obligatorio");
            }

            // Normalizar datos
            usuario.setNombre(usuario.getNombre().trim());
            usuario.setUsuario(usuario.getUsuario().trim().toLowerCase());
            usuario.setCorreo(usuario.getCorreo().trim().toLowerCase());

            // Manejo de contraseñas y actualización
            if (usuario.getId() != null) {
                // Usuario existente - actualización
                Usuario existingUser = usuarioRepository.findById(usuario.getId())
                        .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado para actualizar"));

                // Actualizar campos básicos
                existingUser.setNombre(usuario.getNombre());
                existingUser.setUsuario(usuario.getUsuario());
                existingUser.setCorreo(usuario.getCorreo());
                existingUser.setPerfil(usuario.getPerfil());

                // Solo actualizar contraseña si se proporciona una nueva
                if (usuario.getClave() != null && !usuario.getClave().trim().isEmpty()) {
                    existingUser.setClave(passwordEncoder.encode(usuario.getClave().trim()));
                }

                return usuarioRepository.save(existingUser);
            } else {
                // Nuevo usuario
                if (usuario.getClave() == null || usuario.getClave().trim().isEmpty()) {
                    throw new IllegalArgumentException("La contraseña es obligatoria para nuevos usuarios");
                }
                // Encriptar contraseña
                usuario.setClave(passwordEncoder.encode(usuario.getClave().trim()));
                // Asignar estado activo por defecto a nuevos usuarios
                usuario.setEstado(1);
                return usuarioRepository.save(usuario);
            }

        } catch (DataIntegrityViolationException e) {
            // Manejar violaciones de restricciones únicas
            String message = e.getMessage().toLowerCase();
            if (message.contains("usuario")) {
                throw new IllegalArgumentException("El nombre de usuario ya existe");
            } else if (message.contains("correo") || message.contains("email")) {
                throw new IllegalArgumentException("El correo electrónico ya está registrado");
            } else {
                throw new IllegalArgumentException("Error de integridad de datos");
            }
        } catch (Exception e) {
            throw new RuntimeException("Error al guardar el usuario: " + e.getMessage(), e);
        }
    }

    @Transactional(readOnly = true)
    public long contarUsuarios() {
        // Contamos solo los usuarios que no están eliminados lógicamente
        // Nota: Necesitarás crear este método en tu UsuarioRepository.
        // Ejemplo: long countByEstadoNot(Integer estado);
        return usuarioRepository.countByEstadoNot(2);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> obtenerUsuarioPorId(Long id) {
        if (id == null || id <= 0) {
            return Optional.empty();
        }
        return usuarioRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> findByUsuario(String usuario) {
        return usuarioRepository.findByUsuario(usuario.trim().toLowerCase());
    }

    @Transactional
    public void eliminarUsuario(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("ID de usuario invÃ¡lido");
        }

        // Borrado lógico: cambiamos el estado a 2
        Usuario usuario = obtenerUsuarioPorId(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        usuario.setEstado(2); // 2 significa "eliminado"
        usuarioRepository.save(usuario);
    }

    @Transactional
    public Optional<Usuario> cambiarEstadoUsuario(Long id) {
        if (id == null || id <= 0) {
            return Optional.empty();
        }

        return obtenerUsuarioPorId(id).map(usuario -> {
            // Solo alterna entre 0 (inactivo) y 1 (activo)
            if (usuario.getEstado() == 1) {
                usuario.setEstado(0); // Desactivar
            } else if (usuario.getEstado() == 0) {
                usuario.setEstado(1); // Activar
            }
            // No se hace nada si el estado es 2 (eliminado)
            return usuarioRepository.save(usuario);
        });
    }

    /**
     * Verifica si un nombre de usuario ya existe
     */
    @Transactional(readOnly = true)
    public boolean existeUsuario(String nombreUsuario) {
        if (nombreUsuario == null || nombreUsuario.trim().isEmpty()) {
            return false;
        }
        // Utiliza el método eficiente del repositorio
        return usuarioRepository.existsByUsuario(nombreUsuario.trim().toLowerCase());
    }

    /**
     * Verifica si un correo ya existe
     */
    @Transactional(readOnly = true)
    public boolean existeCorreo(String correo) {
        if (correo == null || correo.trim().isEmpty()) {
            return false;
        }
        // Utiliza el método eficiente del repositorio
        return usuarioRepository.existsByCorreo(correo.trim().toLowerCase());
    }

    /**
     * Verifica la contraseña de un usuario
     */
    public boolean verificarContrasena(String contrasenaTextoPlano, String contrasenaEncriptada) {
        return passwordEncoder.matches(contrasenaTextoPlano, contrasenaEncriptada);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario user = usuarioRepository.findByUsuario(username.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        // DEBUG TEMPORAL - Borrar después de que funcione el login
        System.out.println("=== DEBUG LOGIN ===");
        System.out.println("Usuario encontrado: " + user.getUsuario());
        System.out.println("Clave en BD: [" + user.getClave() + "]");
        System.out.println("Estado: " + user.getEstado());
        System.out.println("Cuenta deshabilitada: " + (user.getEstado() != 1));
        System.out.println("Perfil: " + (user.getPerfil() != null ? user.getPerfil().getNombre() : "null"));
        System.out.println("===================");

        List<GrantedAuthority> authorities = new ArrayList<>();
        if (user.getPerfil() != null) {
            // Añadir el rol principal
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getPerfil().getNombre().toUpperCase()));
            
            // Añadir permisos basados en las opciones del perfil
            if (user.getPerfil().getOpciones() != null) {
                user.getPerfil().getOpciones().forEach(opcion -> {
                    // Convertir nombre de opción a formato de autoridad (ej: "Usuarios" -> "OPCION_USUARIOS")
                    String authName = "OPCION_" + opcion.getNombre().toUpperCase().replace(" ", "_");
                    authorities.add(new SimpleGrantedAuthority(authName));
                });
            }
        }

        return User.builder()
                .username(user.getUsuario())
                .password(user.getClave())
                .disabled(user.getEstado() != 1)
                .accountExpired(false)
                .credentialsExpired(false)
                .accountLocked(false)
                .authorities(authorities)
                .build();
    }
}