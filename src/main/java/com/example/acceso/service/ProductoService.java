package com.example.acceso.service;

import com.example.acceso.model.Producto;
import com.example.acceso.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ProductoService {
    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarTodos() {
        return productoRepository.findAll();
    }

    public List<Producto> listarActivos() {
        return productoRepository.findByEstado(1);
    }

    public Optional<Producto> obtenerPorId(Long id) {
        return productoRepository.findById(id);
    }

    @Transactional
    public Producto guardar(Producto producto) {
        if (producto.getId() != null) {
            return productoRepository.findById(producto.getId()).map(existing -> {
                existing.setNombre(producto.getNombre());
                existing.setDescripcion(producto.getDescripcion());
                if (producto.getCategoria() != null) {
                    existing.setCategoria(producto.getCategoria());
                }
                if (producto.getProveedor() != null) {
                    existing.setProveedor(producto.getProveedor());
                }
                existing.setPrecioCompra(producto.getPrecioCompra());
                existing.setPrecioVenta(producto.getPrecioVenta());
                existing.setStock(producto.getStock());
                existing.setStockMinimo(producto.getStockMinimo());
                if (producto.getImagen() != null) {
                    existing.setImagen(producto.getImagen());
                }
                if (producto.getEstado() != null) {
                    existing.setEstado(producto.getEstado());
                }
                return productoRepository.save(existing);
            }).orElseGet(() -> productoRepository.save(producto));
        }
        if (producto.getEstado() == null) {
            producto.setEstado(1);
        }
        return productoRepository.save(producto);
    }

    @Transactional
    public void eliminar(Long id) {
        productoRepository.findById(id).ifPresent(p -> {
            p.setEstado(0);
            productoRepository.save(p);
        });
    }

    public long contarProductos() {
        return productoRepository.count();
    }

    public List<Map<String, Object>> listarTodosConTotales() {
        return productoRepository.listarProductosConTotalesDeVenta();
    }

    public List<Map<String, Object>> obtenerHistorialVentas(Long idProducto) {
        return productoRepository.obtenerHistorialDeVentasPorProducto(idProducto);
    }

    @Transactional
    public Producto actualizarStock(Long id, int cantidad, String operacion) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        int stockActual = producto.getStock() != null ? producto.getStock() : 0;
        if ("agregar".equalsIgnoreCase(operacion)) {
            producto.setStock(stockActual + cantidad);
        } else {
            producto.setStock(cantidad);
        }
        return productoRepository.save(producto);
    }
}