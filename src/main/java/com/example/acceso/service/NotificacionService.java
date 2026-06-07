package com.example.acceso.service;

import com.example.acceso.model.*;
import com.example.acceso.repository.NotificacionRepository;
import com.example.acceso.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class NotificacionService {

    public static final String TIPO_PEDIDO_NUEVO = "PEDIDO_NUEVO";
    public static final String TIPO_STOCK_BAJO = "STOCK_BAJO";
    public static final String TIPO_STOCK_AGOTADO = "STOCK_AGOTADO";
    public static final String TIPO_CUENTA_COBRAR = "CUENTA_COBRAR";
    public static final String TIPO_CUENTA_COBRAR_VENCIDA = "CUENTA_COBRAR_VENCIDA";
    public static final String TIPO_CUENTA_PAGAR = "CUENTA_PAGAR";

    private final NotificacionRepository notificacionRepository;
    private final UsuarioRepository usuarioRepository;

    public NotificacionService(NotificacionRepository notificacionRepository,
                               UsuarioRepository usuarioRepository) {
        this.notificacionRepository = notificacionRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<Notificacion> listarRecientes(Long usuarioId) {
        return notificacionRepository.findTop50ByUsuarioIdOrderByFechaCreacionDesc(usuarioId);
    }

    public long contarNoLeidas(Long usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    @Transactional
    public void notificarPedidoNuevo(Pedido pedido) {
        if (pedido == null || pedido.getId() == null) return;
        String clienteNombre = pedido.getCliente() != null ? pedido.getCliente().getNombre() : "Cliente";
        double total = pedido.getTotal() != null ? pedido.getTotal() : 0;

        for (Usuario usuario : usuariosActivos()) {
            if (notificacionRepository.existsByTipoAndPedidoIdAndUsuarioIdAndLeidaFalse(
                    TIPO_PEDIDO_NUEVO, pedido.getId(), usuario.getId())) {
                continue;
            }
            guardar(usuario, TIPO_PEDIDO_NUEVO,
                    "Nuevo pedido #" + pedido.getId(),
                    String.format("El cliente %s registró un pedido por S/. %.2f", clienteNombre, total),
                    "/pedidos/listar?pedido=" + pedido.getId(),
                    pedido, null, null, null);
        }
    }

    @Transactional
    public void verificarStockProducto(Producto producto) {
        if (producto == null || producto.getId() == null) return;
        int stock = producto.getStock() != null ? producto.getStock() : 0;
        int minimo = producto.getStockMinimo() != null ? producto.getStockMinimo() : 0;
        String nombre = producto.getNombre();

        String tipo;
        String titulo;
        String mensaje;
        if (stock <= 0) {
            tipo = TIPO_STOCK_AGOTADO;
            titulo = "Sin stock: " + nombre;
            mensaje = "El producto \"" + nombre + "\" no tiene unidades disponibles.";
        } else if (stock <= minimo) {
            tipo = TIPO_STOCK_BAJO;
            titulo = "Stock bajo: " + nombre;
            mensaje = String.format("Quedan %d uds. (mínimo: %d) de \"%s\".", stock, minimo, nombre);
        } else {
            return;
        }

        for (Usuario usuario : usuariosActivos()) {
            if (notificacionRepository.existsByTipoAndProductoIdAndUsuarioIdAndLeidaFalse(
                    tipo, producto.getId(), usuario.getId())) {
                continue;
            }
            guardar(usuario, tipo, titulo, mensaje, "/inventario/listar", null, producto, null, null);
        }
    }

    @Transactional
    public void notificarCuentaCobrar(CuentaCobrar cuenta) {
        if (cuenta == null || cuenta.getId() == null) return;
        String cliente = cuenta.getCliente() != null ? cuenta.getCliente().getNombre() : "Cliente";
        double saldo = cuenta.getSaldoPendiente() != null ? cuenta.getSaldoPendiente() : 0;

        for (Usuario usuario : usuariosActivos()) {
            if (notificacionRepository.existsByTipoAndCuentaCobrarIdAndUsuarioIdAndLeidaFalse(
                    TIPO_CUENTA_COBRAR, cuenta.getId(), usuario.getId())) {
                continue;
            }
            guardar(usuario, TIPO_CUENTA_COBRAR,
                    "Cuenta por cobrar #" + cuenta.getId(),
                    String.format("Nuevo saldo pendiente S/. %.2f de %s", saldo, cliente),
                    "/cuentas-cobrar/listar",
                    null, null, cuenta, null);
        }
    }

    @Transactional
    public void notificarCuentaCobrarVencida(CuentaCobrar cuenta) {
        if (cuenta == null || cuenta.getId() == null) return;
        String cliente = cuenta.getCliente() != null ? cuenta.getCliente().getNombre() : "Cliente";
        double saldo = cuenta.getSaldoPendiente() != null ? cuenta.getSaldoPendiente() : 0;

        for (Usuario usuario : usuariosActivos()) {
            if (notificacionRepository.existsByTipoAndCuentaCobrarIdAndUsuarioIdAndLeidaFalse(
                    TIPO_CUENTA_COBRAR_VENCIDA, cuenta.getId(), usuario.getId())) {
                continue;
            }
            guardar(usuario, TIPO_CUENTA_COBRAR_VENCIDA,
                    "Cobro vencido #" + cuenta.getId(),
                    String.format("Contacte a %s — saldo vencido S/. %.2f", cliente, saldo),
                    "/cuentas-cobrar/listar",
                    null, null, cuenta, null);
        }
    }

    @Transactional
    public void notificarCuentaPagar(CuentaPagar cuenta) {
        if (cuenta == null || cuenta.getId() == null) return;
        String proveedor = cuenta.getProveedor() != null ? cuenta.getProveedor().getNombre() : "Proveedor";
        double saldo = cuenta.getSaldoPendiente() != null ? cuenta.getSaldoPendiente() : 0;

        for (Usuario usuario : usuariosActivos()) {
            if (notificacionRepository.existsByTipoAndCuentaPagarIdAndUsuarioIdAndLeidaFalse(
                    TIPO_CUENTA_PAGAR, cuenta.getId(), usuario.getId())) {
                continue;
            }
            guardar(usuario, TIPO_CUENTA_PAGAR,
                    "Cuenta por pagar #" + cuenta.getId(),
                    String.format("Obligación con %s — saldo pendiente S/. %.2f", proveedor, saldo),
                    "/cuentas-pagar/listar",
                    null, null, null, cuenta);
        }
    }

    @Transactional
    public Optional<Notificacion> marcarLeida(Long id, Long usuarioId) {
        return notificacionRepository.findById(id)
                .filter(n -> n.getUsuario() != null && n.getUsuario().getId().equals(usuarioId))
                .map(n -> {
                    n.setLeida(true);
                    return notificacionRepository.save(n);
                });
    }

    @Transactional
    public void marcarTodasLeidas(Long usuarioId) {
        notificacionRepository.findTop50ByUsuarioIdOrderByFechaCreacionDesc(usuarioId).stream()
                .filter(n -> !Boolean.TRUE.equals(n.getLeida()))
                .forEach(n -> {
                    n.setLeida(true);
                    notificacionRepository.save(n);
                });
    }

    private List<Usuario> usuariosActivos() {
        return usuarioRepository.findByEstado(1);
    }

    private void guardar(Usuario usuario, String tipo, String titulo, String mensaje, String urlDestino,
                         Pedido pedido, Producto producto, CuentaCobrar cuentaCobrar, CuentaPagar cuentaPagar) {
        Notificacion n = new Notificacion();
        n.setUsuario(usuario);
        n.setPedido(pedido);
        n.setProducto(producto);
        n.setCuentaCobrar(cuentaCobrar);
        n.setCuentaPagar(cuentaPagar);
        n.setTipo(tipo);
        n.setTitulo(titulo);
        n.setMensaje(mensaje);
        n.setUrlDestino(urlDestino);
        n.setLeida(false);
        notificacionRepository.save(n);
    }
}
