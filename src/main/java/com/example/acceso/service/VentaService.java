package com.example.acceso.service;

import com.example.acceso.model.DetalleVenta;
import com.example.acceso.model.Producto;
import com.example.acceso.model.Venta;
import com.example.acceso.model.Cliente;
import com.example.acceso.repository.ClienteRepository;
import com.example.acceso.repository.DetalleVentaRepository;
import com.example.acceso.repository.ProductoRepository;
import com.example.acceso.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;

    public VentaService(VentaRepository ventaRepository, 
                        DetalleVentaRepository detalleVentaRepository,
                        ProductoRepository productoRepository,
                        ClienteRepository clienteRepository) {
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.productoRepository = productoRepository;
        this.clienteRepository = clienteRepository;
    }

    public List<Venta> listarTodas() {
        return ventaRepository.findAll();
    }

    public List<Venta> listarActivas() {
        return ventaRepository.findByEstado(1);
    }

    public Optional<Venta> obtenerPorId(Long id) {
        return ventaRepository.findById(id);
    }

    @Transactional
    public Venta registrarVenta(Venta venta) {
        // 1. Validar y recuperar el Cliente completo para obtener el DNI/RUC
        Cliente cliente = clienteRepository.findById(venta.getCliente().getId())
            .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + venta.getCliente().getId()));
        venta.setCliente(cliente);

        // 2. Determinar Tipo de Comprobante, Serie y Correlativo
        if (cliente.getDniRuc() != null && cliente.getDniRuc().length() == 11) {
            venta.setTipoComprobante("FACTURA");
            venta.setSerie("F001");
        } else {
            venta.setTipoComprobante("BOLETA");
            venta.setSerie("B001");
        }
        long nextNum = ventaRepository.count() + 1;
        venta.setNumeroComprobante(String.format("%08d", nextNum));

        // 3. Procesar detalles y calcular subtotales de cada línea
        double calculatedTotal = 0.0;
        for (DetalleVenta detalle : venta.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getId()));
            
            if (producto.getStock() < detalle.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
            }
            
            // Actualizar stock
            producto.setStock(producto.getStock() - detalle.getCantidad());
            productoRepository.save(producto);
            
            // Asegurar descuento no sea nulo
            if (detalle.getDescuento() == null) {
                detalle.setDescuento(0.0);
            }
            
            // Calcular subtotal de la línea = (cantidad * precio) - descuento
            double sub = (detalle.getCantidad() * detalle.getPrecioVenta()) - detalle.getDescuento();
            sub = Math.round(sub * 100.0) / 100.0;
            detalle.setSubtotal(sub);
            calculatedTotal += sub;

            // Asegurar que el detalle tenga la referencia a la venta
            detalle.setVenta(venta);
        }

        // 4. Calcular Total, Subtotal e IGV de la venta general (IGV de 18% incluido en total)
        calculatedTotal = Math.round(calculatedTotal * 100.0) / 100.0;
        venta.setTotal(calculatedTotal);
        
        double subtotal = Math.round((calculatedTotal / 1.18) * 100.0) / 100.0;
        double igv = Math.round((calculatedTotal - subtotal) * 100.0) / 100.0;
        
        venta.setSubtotal(subtotal);
        venta.setIgv(igv);
        
        return ventaRepository.save(venta);
    }

    @Transactional
    public void cancelarVenta(Long id) {
        ventaRepository.findById(id).ifPresent(venta -> {
            if (venta.getEstado() == 1) {
                // Devolver stock
                for (DetalleVenta detalle : venta.getDetalles()) {
                    Producto producto = detalle.getProducto();
                    producto.setStock(producto.getStock() + detalle.getCantidad());
                    productoRepository.save(producto);
                }
                venta.setEstado(0); // Cancelada
                ventaRepository.save(venta);
            }
        });
    }
}
