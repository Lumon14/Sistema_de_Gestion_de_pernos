package com.example.acceso.service;

import com.example.acceso.model.Categoria;
import com.example.acceso.repository.CategoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class CategoriaService {
    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    public List<Categoria> listarTodas() {
        // Excluimos categorías con estado = 2 (eliminadas lógicamente)
        return categoriaRepository.findAllByEstadoNot(2);
    }

    public List<Categoria> listarActivas() {
        return categoriaRepository.findByEstado(1);
    }

    public Optional<Categoria> obtenerPorId(Long id) {
        return categoriaRepository.findById(id);
    }

    @Transactional
    public Categoria guardar(Categoria categoria) {
        validarNombre(categoria.getNombre());

        if (categoria.getId() != null) {
            return categoriaRepository.findById(categoria.getId()).map(existing -> {
                existing.setNombre(categoria.getNombre());
                existing.setDescripcion(categoria.getDescripcion());
                // Preservamos el estado si no se envía uno nuevo
                if (categoria.getEstado() != null) {
                    existing.setEstado(categoria.getEstado());
                }
                return categoriaRepository.save(existing);
            }).orElseGet(() -> categoriaRepository.save(categoria));
        }
        if (categoria.getEstado() == null) {
            categoria.setEstado(1);
        }
        return categoriaRepository.save(categoria);
    }

    @Transactional
    public void eliminar(Long id) {
        categoriaRepository.findById(id).ifPresent(c -> {
            c.setEstado(2); // 2: Borrado lógico
            categoriaRepository.save(c);
        });
    }

    @Transactional
    public Optional<Categoria> cambiarEstado(Long id) {
        return categoriaRepository.findById(id).map(c -> {
            if (c.getEstado() == 2) {
                return c; // No cambiar estado de una categoría eliminada
            }
            c.setEstado(c.getEstado() == 1 ? 0 : 1);
            return categoriaRepository.save(c);
        });
    }

    private static final String MSG_NOMBRE_INVALIDO = "no se permite caracteres especiales (), @, \", +,-. ";
    private static final Pattern REGEX_NOMBRE = Pattern.compile("^[\\p{L}\\s]+$");

    private void validarNombre(String nombre) {
        if (nombre == null || nombre.trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        if (!REGEX_NOMBRE.matcher(nombre.trim()).matches()) {
            throw new IllegalArgumentException(MSG_NOMBRE_INVALIDO);
        }
    }
}
