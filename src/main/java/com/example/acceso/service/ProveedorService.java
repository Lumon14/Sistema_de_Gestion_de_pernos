package com.example.acceso.service;

import com.example.acceso.model.Proveedor;
import com.example.acceso.repository.ProveedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProveedorService {
    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    public List<Proveedor> listarTodos() {
        return proveedorRepository.findAll();
    }

    public List<Proveedor> listarActivos() {
        return proveedorRepository.findByEstado(1);
    }

    public Optional<Proveedor> obtenerPorId(Long id) {
        return proveedorRepository.findById(id);
    }

    @Transactional
    public Proveedor guardar(Proveedor proveedor) {
        if (proveedor.getId() != null) {
            return proveedorRepository.findById(proveedor.getId()).map(existing -> {
                existing.setDocumento(proveedor.getDocumento());
                existing.setNombre(proveedor.getNombre());
                existing.setDireccion(proveedor.getDireccion());
                existing.setTelefono(proveedor.getTelefono());
                if (proveedor.getEstado() != null) {
                    existing.setEstado(proveedor.getEstado());
                }
                return proveedorRepository.save(existing);
            }).orElseGet(() -> proveedorRepository.save(proveedor));
        }
        if (proveedor.getEstado() == null) {
            proveedor.setEstado(1);
        }
        return proveedorRepository.save(proveedor);
    }

    @Transactional
    public void eliminar(Long id) {
        proveedorRepository.findById(id).ifPresent(p -> {
            p.setEstado(0); // Borrado lógico
            proveedorRepository.save(p);
        });
    }
}
