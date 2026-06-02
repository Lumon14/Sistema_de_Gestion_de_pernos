package com.example.acceso.service;

import com.example.acceso.model.*;
import com.example.acceso.repository.ClienteRepository;
import com.example.acceso.repository.PedidoRepository;
import com.example.acceso.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final VentaService ventaService;

    public PedidoService(PedidoRepository pedidoRepository,
                         ClienteRepository clienteRepository,
                         ProductoRepository productoRepository,
                         VentaService ventaService) {
        this.pedidoRepository = pedidoRepository;
        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
        this.ventaService = ventaService;
    }

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll();
    }

    public List<Pedido> listarPendientes() {
        return pedidoRepository.findByEstado("PENDIENTE");
    }

    public long contarPendientes() {
        return pedidoRepository.countByEstado("PENDIENTE");
    }

    public Optional<Pedido> obtenerPorId(Long id) {
        return pedidoRepository.findById(id);
    }

    @Transactional
    public Pedido registrarPedido(Pedido pedido, Cliente clienteInfo) {
        // 1. Validar y asociar Cliente
        Cliente cliente = clienteRepository.findByDniRuc(clienteInfo.getDniRuc())
                .orElseGet(() -> {
                    // Si no existe, crear un nuevo cliente
                    clienteInfo.setEstado(1); // Activo por defecto
                    return clienteRepository.save(clienteInfo);
                });
        
        // Si el cliente ya existe pero se enviaron datos actualizados, actualizarlos opcionalmente
        if (clienteInfo.getNombre() != null && !clienteInfo.getNombre().isBlank()) {
            cliente.setNombre(clienteInfo.getNombre());
        }
        if (clienteInfo.getTelefono() != null && !clienteInfo.getTelefono().isBlank()) {
            cliente.setTelefono(clienteInfo.getTelefono());
        }
        if (clienteInfo.getEmail() != null && !clienteInfo.getEmail().isBlank()) {
            cliente.setEmail(clienteInfo.getEmail());
        }
        clienteRepository.save(cliente);
        
        pedido.setCliente(cliente);
        pedido.setEstado("PENDIENTE");

        // 2. Procesar detalles de pedido y calcular montos
        double total = 0.0;
        List<DetallePedido> detallesProcesados = new ArrayList<>();
        
        for (DetallePedido detalle : pedido.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getId()));
            
            detalle.setProducto(producto);
            detalle.setPrecioUnitario(producto.getPrecioVenta());
            
            double sub = detalle.getCantidad() * producto.getPrecioVenta();
            sub = Math.round(sub * 100.0) / 100.0;
            detalle.setSubtotal(sub);
            
            total += sub;
            detalle.setPedido(pedido);
            detallesProcesados.add(detalle);
        }

        pedido.setDetalles(detallesProcesados);
        pedido.setTotal(Math.round(total * 100.0) / 100.0);

        return pedidoRepository.save(pedido);
    }

    @Transactional
    public Venta completarPedido(Long id, Usuario usuarioAdmin) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + id));

        if (!"PENDIENTE".equals(pedido.getEstado())) {
            throw new RuntimeException("Solo se pueden completar pedidos en estado PENDIENTE");
        }

        // 1. Cambiar estado del pedido
        pedido.setEstado("COMPLETADO");
        pedidoRepository.save(pedido);

        // 2. Crear Venta a partir del Pedido
        Venta venta = new Venta();
        venta.setCliente(pedido.getCliente());
        venta.setUsuario(usuarioAdmin);
        venta.setEstado(1); // Activa / Procesada

        List<DetalleVenta> detallesVenta = new ArrayList<>();
        for (DetallePedido dp : pedido.getDetalles()) {
            DetalleVenta dv = new DetalleVenta();
            dv.setVenta(venta);
            dv.setProducto(dp.getProducto());
            dv.setCantidad(dp.getCantidad());
            dv.setPrecioVenta(dp.getPrecioUnitario());
            dv.setDescuento(0.0);
            dv.setSubtotal(dp.getSubtotal());
            detallesVenta.add(dv);
        }
        venta.setDetalles(detallesVenta);

        // 3. Registrar venta (esto descuenta stock y hace los cálculos de IGV / comprobante)
        return ventaService.registrarVenta(venta);
    }

    @Transactional
    public void cancelarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + id));

        if (!"PENDIENTE".equals(pedido.getEstado())) {
            throw new RuntimeException("Solo se pueden cancelar pedidos en estado PENDIENTE");
        }

        pedido.setEstado("CANCELADO");
        pedidoRepository.save(pedido);
    }
}
