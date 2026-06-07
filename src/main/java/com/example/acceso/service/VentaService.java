package com.example.acceso.service;

import com.example.acceso.dto.CanjearNotaVentaRequest;
import com.example.acceso.model.*;
import com.example.acceso.repository.ClienteRepository;
import com.example.acceso.repository.DetalleVentaRepository;
import com.example.acceso.repository.ProductoRepository;
import com.example.acceso.repository.VentaRepository;
import com.example.acceso.repository.CuentaCobrarRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class VentaService {

    private static final double IGV_RATE = 0.18;

    private final VentaRepository ventaRepository;
    private final DetalleVentaRepository detalleVentaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final NotificacionService notificacionService;
    private final CuentaCobrarRepository cuentaCobrarRepository;

    public VentaService(VentaRepository ventaRepository,
                        DetalleVentaRepository detalleVentaRepository,
                        ProductoRepository productoRepository,
                        ClienteRepository clienteRepository,
                        NotificacionService notificacionService,
                        CuentaCobrarRepository cuentaCobrarRepository) {
        this.ventaRepository = ventaRepository;
        this.detalleVentaRepository = detalleVentaRepository;
        this.productoRepository = productoRepository;
        this.clienteRepository = clienteRepository;
        this.notificacionService = notificacionService;
        this.cuentaCobrarRepository = cuentaCobrarRepository;
    }

    public List<Venta> listarTodas() {
        return ventaRepository.findAll();
    }

    public List<Venta> listarPorTipo(String tipoComprobante) {
        return ventaRepository.findByTipoComprobanteOrderByFechaDesc(tipoComprobante);
    }

    public List<Venta> listarActivas() {
        return ventaRepository.findByEstado(1);
    }

    public List<Venta> listarVentasSinCuentaCobrar() {
        return ventaRepository.findSinCuentaCobrar();
    }

    public Optional<Venta> obtenerPorId(Long id) {
        return ventaRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> obtenerDetalleParaApi(Long id) {
        return ventaRepository.findById(id).map(v -> {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id", v.getId());
            data.put("fecha", v.getFecha());
            data.put("total", v.getTotal());
            data.put("subtotal", v.getSubtotal());
            data.put("igv", v.getIgv());
            data.put("tipoComprobante", v.getTipoComprobante());
            data.put("serie", v.getSerie());
            data.put("numeroComprobante", v.getNumeroComprobante());
            data.put("estado", v.getEstado());
            data.put("estadoDocumento", v.getEstadoDocumento());
            data.put("cliente", v.getCliente());
            data.put("usuario", v.getUsuario());
            data.put("detalles", detalleVentaRepository.findByVentaId(id));
            return data;
        });
    }

    /** Registra una NOTA DE VENTA de mostrador: descuenta stock inmediatamente. */
    @Transactional
    public Venta registrarNotaVenta(Venta venta) {
        venta.setTipoComprobante(TipoComprobanteVenta.NOTA);
        venta.setSerie("NV001");
        venta.setEstadoDocumento(EstadoDocumentoVenta.PENDIENTE);
        venta.setAfectaInventario(true);
        venta.setEstado(1);
        return persistirVenta(venta, true);
    }

    @Transactional
    public Venta canjearNotaVenta(Long notaId, CanjearNotaVentaRequest request, Usuario usuario) {
        Venta nota = ventaRepository.findById(notaId)
                .orElseThrow(() -> new IllegalArgumentException("Nota de venta no encontrada"));

        if (!TipoComprobanteVenta.NOTA.equals(nota.getTipoComprobante())) {
            throw new IllegalArgumentException("El comprobante no es una Nota de Venta");
        }
        if (!EstadoDocumentoVenta.PENDIENTE.equals(nota.getEstadoDocumento())) {
            throw new IllegalArgumentException("Solo se pueden canjear notas en estado PENDIENTE");
        }
        if (nota.getEstado() != null && nota.getEstado() == 0) {
            throw new IllegalArgumentException("La nota de venta está anulada");
        }

        List<DetalleVenta> detallesNota = detalleVentaRepository.findByVentaId(notaId);
        if (detallesNota.isEmpty()) {
            throw new IllegalArgumentException("La nota de venta no tiene detalle de productos");
        }

        String tipoDestino = request.getTipoDestino() != null
                ? request.getTipoDestino().trim().toUpperCase()
                : "";
        if (!TipoComprobanteVenta.BOLETA.equals(tipoDestino)
                && !TipoComprobanteVenta.FACTURA.equals(tipoDestino)) {
            throw new IllegalArgumentException("Tipo destino inválido. Use BOLETA o FACTURA");
        }

        Cliente cliente = resolverClienteCanje(request, tipoDestino);

        // Validar cuotas si aplica
        if (Boolean.TRUE.equals(request.getPagarCuotas())) {
            if (request.getCuotas() == null || request.getCuotas().isEmpty()) {
                throw new IllegalArgumentException("Debe especificar las cuotas a pagar");
            }
            double sumCuotas = 0;
            for (CanjearNotaVentaRequest.CuotaDTO c : request.getCuotas()) {
                if (c.getMonto() == null || c.getMonto() <= 0) {
                    throw new IllegalArgumentException("El monto de la cuota debe ser mayor a cero");
                }
                if (c.getFechaPago() == null || c.getFechaPago().isBlank()) {
                    throw new IllegalArgumentException("Debe especificar la fecha de pago de todas las cuotas");
                }
                sumCuotas += c.getMonto();
            }
            sumCuotas = redondear(sumCuotas);
            if (Math.abs(sumCuotas - nota.getTotal()) > 0.05) {
                throw new IllegalArgumentException("La suma de las cuotas (S/ " + sumCuotas + ") no coincide con el total (S/ " + nota.getTotal() + ")");
            }
        }

        Venta comprobante = new Venta();
        comprobante.setUsuario(usuario);
        comprobante.setCliente(cliente);
        comprobante.setTipoComprobante(tipoDestino);
        comprobante.setSerie(TipoComprobanteVenta.FACTURA.equals(tipoDestino) ? "F001" : "B001");
        comprobante.setNumeroComprobante(siguienteNumero(comprobante.getSerie()));
        comprobante.setEstado(1);
        comprobante.setEstadoDocumento(EstadoDocumentoVenta.EMITIDA);
        comprobante.setAfectaInventario(false);
        comprobante.setNotaOrigen(nota);
        comprobante.setTotal(nota.getTotal());

        if (TipoComprobanteVenta.FACTURA.equals(tipoDestino)) {
            double subtotal = redondear(nota.getTotal() / (1 + IGV_RATE));
            double igv = redondear(nota.getTotal() - subtotal);
            comprobante.setSubtotal(subtotal);
            comprobante.setIgv(igv);
        } else {
            comprobante.setSubtotal(nota.getTotal());
            comprobante.setIgv(0.0);
        }

        List<DetalleVenta> detallesCopia = new ArrayList<>();
        for (DetalleVenta original : detallesNota) {
            DetalleVenta copia = new DetalleVenta();
            copia.setVenta(comprobante);
            copia.setProducto(original.getProducto());
            copia.setCantidad(original.getCantidad());
            copia.setPrecioVenta(original.getPrecioVenta());
            copia.setDescuento(original.getDescuento() != null ? original.getDescuento() : 0.0);
            copia.setSubtotal(original.getSubtotal());
            detallesCopia.add(copia);
        }
        comprobante.setDetalles(detallesCopia);

        Venta guardada = ventaRepository.save(comprobante);

        // Registrar cuotas en cuentas por cobrar si es por cuotas
        if (Boolean.TRUE.equals(request.getPagarCuotas())) {
            for (CanjearNotaVentaRequest.CuotaDTO c : request.getCuotas()) {
                CuentaCobrar cc = new CuentaCobrar();
                cc.setCliente(cliente);
                cc.setVenta(guardada);
                cc.setSaldoPendiente(c.getMonto());
                cc.setEstado("PENDIENTE");
                cc.setFechaCreacion(java.time.LocalDateTime.now());
                cc.setFechaPago(java.time.LocalDate.parse(c.getFechaPago()));
                cuentaCobrarRepository.save(cc);
            }
        }

        nota.setEstadoDocumento(EstadoDocumentoVenta.CANJEADA);
        nota.setComprobanteCanje(guardada);
        ventaRepository.save(nota);

        return guardada;
    }

    @Transactional
    public void cancelarVenta(Long id) {
        ventaRepository.findById(id).ifPresent(venta -> {
            if (venta.getEstado() == null || venta.getEstado() != 1) {
                return;
            }
            if (EstadoDocumentoVenta.CANJEADA.equals(venta.getEstadoDocumento())) {
                throw new IllegalArgumentException("No se puede anular una nota ya canjeada");
            }
            if (Boolean.TRUE.equals(venta.getAfectaInventario())) {
                devolverStock(venta);
            }
            venta.setEstado(0);
            venta.setEstadoDocumento(EstadoDocumentoVenta.ANULADA);
            ventaRepository.save(venta);
        });
    }

    /** Compatibilidad: delega a registrarNotaVenta. */
    @Transactional
    public Venta registrarVenta(Venta venta) {
        return registrarNotaVenta(venta);
    }

    private Venta persistirVenta(Venta venta, boolean descontarStock) {
        Cliente cliente = clienteRepository.findById(venta.getCliente().getId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        venta.setCliente(cliente);

        if (venta.getNumeroComprobante() == null || venta.getNumeroComprobante().isBlank()) {
            venta.setNumeroComprobante(siguienteNumero(venta.getSerie()));
        }

        double calculatedTotal = 0.0;
        for (DetalleVenta detalle : venta.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));

            if (descontarStock) {
                int stock = producto.getStock() != null ? producto.getStock() : 0;
                if (stock < detalle.getCantidad()) {
                    throw new IllegalArgumentException("Stock insuficiente: " + producto.getNombre());
                }
                producto.setStock(stock - detalle.getCantidad());
                productoRepository.save(producto);
                notificacionService.verificarStockProducto(producto);
            }

            if (detalle.getDescuento() == null) {
                detalle.setDescuento(0.0);
            }
            double sub = redondear((detalle.getCantidad() * detalle.getPrecioVenta()) - detalle.getDescuento());
            detalle.setSubtotal(sub);
            calculatedTotal += sub;
            detalle.setVenta(venta);
        }

        calculatedTotal = redondear(calculatedTotal);
        venta.setTotal(calculatedTotal);
        venta.setSubtotal(calculatedTotal);
        venta.setIgv(0.0);

        return ventaRepository.save(venta);
    }

    private Cliente resolverClienteCanje(CanjearNotaVentaRequest request, String tipoDestino) {
        if (request.getClienteId() != null) {
            return clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        }

        String dniRuc = request.getDniRuc() != null ? request.getDniRuc().trim() : "";
        if (TipoComprobanteVenta.FACTURA.equals(tipoDestino)) {
            if (!dniRuc.matches("\\d{11}")) {
                throw new IllegalArgumentException("Para Factura ingrese un RUC válido de 11 dígitos");
            }
        } else if (!dniRuc.isEmpty() && !dniRuc.matches("\\d{8}")) {
            throw new IllegalArgumentException("Para Boleta ingrese un DNI válido de 8 dígitos o déjelo vacío");
        }

        if (!dniRuc.isEmpty()) {
            Optional<Cliente> existente = clienteRepository.findByDniRuc(dniRuc);
            if (existente.isPresent()) {
                return existente.get();
            }
        }

        if (request.getNombre() == null || request.getNombre().isBlank()) {
            throw new IllegalArgumentException("El nombre del cliente es obligatorio");
        }

        Cliente nuevo = new Cliente();
        nuevo.setDniRuc(dniRuc.isEmpty() ? null : dniRuc);
        nuevo.setNombre(request.getNombre().trim());
        nuevo.setTelefono(blankToNull(request.getTelefono()));
        nuevo.setEmail(blankToNull(request.getEmail()));
        nuevo.setDireccion(blankToNull(request.getDireccion()));
        nuevo.setEstado(1);
        return clienteRepository.save(nuevo);
    }

    private void devolverStock(Venta venta) {
        List<DetalleVenta> detalles = detalleVentaRepository.findByVentaId(venta.getId());
        for (DetalleVenta detalle : detalles) {
            Producto producto = detalle.getProducto();
            int stock = producto.getStock() != null ? producto.getStock() : 0;
            producto.setStock(stock + detalle.getCantidad());
            productoRepository.save(producto);
        }
    }

    private String siguienteNumero(String serie) {
        Integer max = ventaRepository.findMaxNumeroBySerie(serie);
        int next = (max != null ? max : 0) + 1;
        return String.format("%08d", next);
    }

    private static double redondear(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public Venta editarNotaVenta(Long id, Venta ventaActualizada) {
        Venta existente = ventaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Nota de venta no encontrada"));

        if (!TipoComprobanteVenta.NOTA.equals(existente.getTipoComprobante())) {
            throw new IllegalArgumentException("Solo se pueden editar notas de venta");
        }

        if (!EstadoDocumentoVenta.PENDIENTE.equals(existente.getEstadoDocumento())) {
            throw new IllegalArgumentException("Solo se pueden editar notas de venta en estado PENDIENTE");
        }

        if (existente.getEstado() != null && existente.getEstado() == 0) {
            throw new IllegalArgumentException("La nota de venta está anulada");
        }

        // 1. Devolver stock anterior
        devolverStock(existente);

        // 2. Limpiar detalles antiguos
        List<DetalleVenta> detallesAntiguos = detalleVentaRepository.findByVentaId(id);
        detalleVentaRepository.deleteAll(detallesAntiguos);

        // 3. Actualizar datos básicos (cliente)
        Cliente cliente = clienteRepository.findById(ventaActualizada.getCliente().getId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado"));
        existente.setCliente(cliente);

        // 4. Calcular y descontar stock nuevo
        double calculatedTotal = 0.0;
        List<DetalleVenta> nuevosDetalles = new ArrayList<>();

        for (DetalleVenta detalle : ventaActualizada.getDetalles()) {
            Producto producto = productoRepository.findById(detalle.getProducto().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + detalle.getProducto().getId()));

            int stock = producto.getStock() != null ? producto.getStock() : 0;
            if (stock < detalle.getCantidad()) {
                throw new IllegalArgumentException("Stock insuficiente para: " + producto.getNombre());
            }
            producto.setStock(stock - detalle.getCantidad());
            productoRepository.save(producto);
            notificacionService.verificarStockProducto(producto);

            if (detalle.getDescuento() == null) {
                detalle.setDescuento(0.0);
            }
            double sub = redondear((detalle.getCantidad() * detalle.getPrecioVenta()) - detalle.getDescuento());
            detalle.setSubtotal(sub);
            calculatedTotal += sub;

            detalle.setVenta(existente);
            nuevosDetalles.add(detalle);
        }

        calculatedTotal = redondear(calculatedTotal);
        existente.setTotal(calculatedTotal);
        existente.setSubtotal(calculatedTotal);
        existente.setIgv(0.0);

        // Guardar detalles nuevos
        detalleVentaRepository.saveAll(nuevosDetalles);

        return ventaRepository.save(existente);
    }
}
