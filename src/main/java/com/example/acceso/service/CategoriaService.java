package com.example.acceso.service;

import com.example.acceso.model.Categoria;
import com.example.acceso.repository.CategoriaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CategoriaService {
    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    public List<Categoria> listarTodas() {
        return categoriaRepository.findAll();
    }

    public List<Categoria> listarActivas() {
        return categoriaRepository.findByEstado(1);
    }

    public Optional<Categoria> obtenerPorId(Long id) {
        return categoriaRepository.findById(id);
    }

    @Transactional
    public Categoria guardar(Categoria categoria) {
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
            c.setEstado(0); // Borrado lógico
            categoriaRepository.save(c);
        });
    }
}
