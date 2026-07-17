package com.example.acceso.service;

import com.example.acceso.model.Perfil;
import com.example.acceso.model.Opcion;
import com.example.acceso.repository.PerfilRepository;
import com.example.acceso.repository.OpcionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class PerfilServiceImpl implements PerfilService {

    private final PerfilRepository perfilRepository;
    private final OpcionRepository opcionRepository;

    public PerfilServiceImpl(PerfilRepository perfilRepository, OpcionRepository opcionRepository) {
        this.perfilRepository = perfilRepository;
        this.opcionRepository = opcionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Perfil> listarPerfilesActivos() {
        return perfilRepository.findByEstado(1);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Perfil> listarTodosLosPerfiles() {
        // Excluimos perfiles con estado = 2 (eliminados lógicamente)
        return perfilRepository.findAllByEstadoNot(2);
    }

    private static final String MSG_NOMBRE_INVALIDO = "no se permite caracteres especiales (), @, \", +,-. ";
    private static final Pattern REGEX_NOMBRE = Pattern.compile("^[\\p{L}\\s]+$");

    @Override
    @Transactional
    public Perfil guardarPerfil(Perfil perfil) {
        if (perfil.getNombre() != null) {
            validarNombre(perfil.getNombre());
            perfil.setNombre(perfil.getNombre().trim());
        }
        return perfilRepository.save(perfil);
    }

    private void validarNombre(String nombre) {
        if (nombre.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (!REGEX_NOMBRE.matcher(nombre.trim()).matches()) {
            throw new IllegalArgumentException(MSG_NOMBRE_INVALIDO);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Perfil> obtenerPerfilPorId(Long id) {
        return perfilRepository.findById(id);
    }

    @Override
    @Transactional
    public Optional<Perfil> cambiarEstadoPerfil(Long id) {
        return perfilRepository.findById(id).map(perfil -> {
            if (perfil.getEstado() == 2) {
                return perfil; // No cambiar estado de un perfil eliminado
            }
            perfil.setEstado(perfil.getEstado() == 1 ? 0 : 1);
            return perfilRepository.save(perfil);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public List<Opcion> listarTodasLasOpciones() {
        return opcionRepository.findAll();
    }

    @Override
    @Transactional
    public void eliminarPerfil(Long id) {
        perfilRepository.findById(id).ifPresent(perfil -> {
            perfil.setEstado(2); // 2: Borrado lógico
            perfilRepository.save(perfil);
        });
    }
}