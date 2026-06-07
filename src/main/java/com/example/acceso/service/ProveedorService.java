package com.example.acceso.service;

import com.example.acceso.model.Proveedor;
import com.example.acceso.repository.ProveedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class ProveedorService {
    private static final Pattern REGEX_SOLO_DIGITOS = Pattern.compile("^\\d+$");

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
        validarProveedor(proveedor);
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

    private void validarProveedor(Proveedor proveedor) {
        if (proveedor.getDocumento() == null || proveedor.getDocumento().trim().isEmpty()) {
            throw new IllegalArgumentException("El documento es obligatorio");
        }
        String documento = proveedor.getDocumento().trim();
        if (!REGEX_SOLO_DIGITOS.matcher(documento).matches()
                || (documento.length() != 8 && documento.length() != 11)) {
            throw new IllegalArgumentException("ingrese un dni o ruc valido");
        }
        proveedor.setDocumento(documento);

        if (proveedor.getNombre() == null || proveedor.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre es obligatorio");
        }
        proveedor.setNombre(proveedor.getNombre().trim());

        if (proveedor.getTelefono() != null && !proveedor.getTelefono().trim().isEmpty()) {
            String telefono = proveedor.getTelefono().trim();
            if (!REGEX_SOLO_DIGITOS.matcher(telefono).matches() || telefono.length() != 9) {
                throw new IllegalArgumentException("ingrese un teléfono valido");
            }
            proveedor.setTelefono(telefono);
        }

        if (proveedor.getDireccion() != null) {
            proveedor.setDireccion(proveedor.getDireccion().trim());
        }
    }
}
