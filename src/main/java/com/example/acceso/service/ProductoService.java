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
    private final NotificacionService notificacionService;

    public ProductoService(ProductoRepository productoRepository, NotificacionService notificacionService) {
        this.productoRepository = productoRepository;
        this.notificacionService = notificacionService;
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

    private static final String MSG_NUMERO_NEGATIVO = "El número ingresado es negativo, ingrese uno positivo";

    @Transactional
    public Producto guardar(Producto producto) {
        validarValoresNumericos(producto);

        if (producto.getId() != null) {
            return productoRepository.findById(producto.getId())
                    .map(existing -> {
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
                        if (producto.getPrecioVenta() != null) {
                            existing.setPrecio(producto.getPrecioVenta());
                        }
                        existing.setStock(producto.getStock());
                        existing.setStockMinimo(producto.getStockMinimo());
                        if (producto.getImagen() != null) {
                            existing.setImagen(producto.getImagen());
                        }
                        if (producto.getEstado() != null) {
                            existing.setEstado(producto.getEstado());
                        }
                        Producto saved = productoRepository.save(existing);
                        notificacionService.verificarStockProducto(saved);
                        return saved;
                    })
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
        }

        producto.setId(null);
        productoRepository.syncIdSequence();
        if (producto.getEstado() == null) {
            producto.setEstado(1);
        }
        if (producto.getPrecioVenta() != null) {
            producto.setPrecio(producto.getPrecioVenta());
        }
        Producto saved = productoRepository.save(producto);
        notificacionService.verificarStockProducto(saved);
        return saved;
    }

    private void validarValoresNumericos(Producto producto) {
        if (producto.getPrecioCompra() != null && producto.getPrecioCompra() < 0) {
            throw new IllegalArgumentException(MSG_NUMERO_NEGATIVO);
        }
        if (producto.getPrecioVenta() != null && producto.getPrecioVenta() < 0) {
            throw new IllegalArgumentException(MSG_NUMERO_NEGATIVO);
        }
        if (producto.getStock() != null && producto.getStock() < 0) {
            throw new IllegalArgumentException(MSG_NUMERO_NEGATIVO);
        }
        if (producto.getStockMinimo() != null && producto.getStockMinimo() < 0) {
            throw new IllegalArgumentException(MSG_NUMERO_NEGATIVO);
        }
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
        Producto saved = productoRepository.save(producto);
        notificacionService.verificarStockProducto(saved);
        return saved;
    }
}