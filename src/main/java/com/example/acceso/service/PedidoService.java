package com.example.acceso.service;

import com.example.acceso.model.*;
import com.example.acceso.repository.PedidoRepository;
import com.example.acceso.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteService clienteService;
    private final ConsultaService consultaService;
    private final ProductoRepository productoRepository;
    private final VentaService ventaService;
    private final NotificacionService notificacionService;

    public PedidoService(PedidoRepository pedidoRepository,
                         ClienteService clienteService,
                         ConsultaService consultaService,
                         ProductoRepository productoRepository,
                         VentaService ventaService,
                         NotificacionService notificacionService) {
        this.pedidoRepository = pedidoRepository;
        this.clienteService = clienteService;
        this.consultaService = consultaService;
        this.productoRepository = productoRepository;
        this.ventaService = ventaService;
        this.notificacionService = notificacionService;
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

    public static class ResultadoPedido {
        private final Pedido pedido;
        private final String mensajeCliente;

        public ResultadoPedido(Pedido pedido, String mensajeCliente) {
            this.pedido = pedido;
            this.mensajeCliente = mensajeCliente;
        }

        public Pedido getPedido() {
            return pedido;
        }

        public String getMensajeCliente() {
            return mensajeCliente;
        }
    }

    @Transactional
    public ResultadoPedido registrarPedido(Pedido pedido, Cliente clienteInfo) {
        enriquecerClienteDesdeConsultaExterna(clienteInfo);
        ClienteService.ResultadoCliente resultadoCliente = clienteService.buscarOCrear(clienteInfo);
        pedido.setCliente(resultadoCliente.getCliente());
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

        Pedido guardado = pedidoRepository.save(pedido);
        String mensajeCliente = construirMensajeCliente(resultadoCliente);

        notificacionService.notificarPedidoNuevo(guardado);

        return new ResultadoPedido(guardado, mensajeCliente);
    }

    private String construirMensajeCliente(ClienteService.ResultadoCliente resultadoCliente) {
        if (resultadoCliente.isCreado()) {
            return "El cliente fue registrado automáticamente en el sistema.";
        }
        if (resultadoCliente.isActualizado()) {
            return "Los datos del cliente existente fueron actualizados.";
        }
        return "Se utilizó el registro del cliente existente.";
    }

    private void enriquecerClienteDesdeConsultaExterna(Cliente clienteInfo) {
        if (clienteInfo == null || clienteInfo.getDniRuc() == null || clienteInfo.getDniRuc().isBlank()) {
            return;
        }

        boolean nombreVacio = clienteInfo.getNombre() == null || clienteInfo.getNombre().isBlank();
        boolean nombreSimulado = consultaService.esNombreSimulado(clienteInfo.getNombre());
        if (!nombreVacio && !nombreSimulado) {
            return;
        }

        Map<String, Object> consulta = consultaService.consultarDocumento(clienteInfo.getDniRuc());
        if (Boolean.TRUE.equals(consulta.get("success"))) {
            if (consulta.get("nombre") != null) {
                clienteInfo.setNombre(consulta.get("nombre").toString());
            }
            if (clienteInfo.getDireccion() == null && consulta.get("direccion") != null) {
                clienteInfo.setDireccion(consulta.get("direccion").toString());
            }
        }
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

    @Transactional
    public Pedido editarPedido(Long id, Pedido pedidoActualizado) {
        Pedido existente = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado: " + id));

        if (!"PENDIENTE".equals(existente.getEstado())) {
            throw new RuntimeException("Solo se pueden editar pedidos en estado PENDIENTE");
        }

        // Buscar o crear cliente si se envió información modificada
        if (pedidoActualizado.getCliente() != null) {
            Cliente clienteInfo = pedidoActualizado.getCliente();
            enriquecerClienteDesdeConsultaExterna(clienteInfo);
            ClienteService.ResultadoCliente resultadoCliente = clienteService.buscarOCrear(clienteInfo);
            existente.setCliente(resultadoCliente.getCliente());
        }

        // Actualizar detalles y calcular total
        existente.getDetalles().clear();
        double total = 0.0;
        List<DetallePedido> detallesProcesados = new ArrayList<>();

        for (DetallePedido detalle : pedidoActualizado.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalle.getProducto().getId()));

            DetallePedido nuevoDetalle = new DetallePedido();
            nuevoDetalle.setProducto(producto);
            nuevoDetalle.setCantidad(detalle.getCantidad());
            nuevoDetalle.setPrecioUnitario(producto.getPrecioVenta());

            double sub = detalle.getCantidad() * producto.getPrecioVenta();
            sub = Math.round(sub * 100.0) / 100.0;
            nuevoDetalle.setSubtotal(sub);

            total += sub;
            nuevoDetalle.setPedido(existente);
            detallesProcesados.add(nuevoDetalle);
        }

        existente.getDetalles().addAll(detallesProcesados);
        existente.setTotal(Math.round(total * 100.0) / 100.0);

        return pedidoRepository.save(existente);
    }
}
