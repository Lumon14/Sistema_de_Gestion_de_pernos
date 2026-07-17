package com.example.acceso.service;

import com.example.acceso.model.Cliente;
import com.example.acceso.model.CuentaCobrar;
import com.example.acceso.model.Venta;
import com.example.acceso.repository.CuentaCobrarRepository;
import com.example.acceso.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CuentaCobrarService {

    private final CuentaCobrarRepository cuentaCobrarRepository;
    private final VentaRepository ventaRepository;
    private final NotificacionService notificacionService;

    public CuentaCobrarService(CuentaCobrarRepository cuentaCobrarRepository,
                               VentaRepository ventaRepository,
                               NotificacionService notificacionService) {
        this.cuentaCobrarRepository = cuentaCobrarRepository;
        this.ventaRepository = ventaRepository;
        this.notificacionService = notificacionService;
    }

    public List<CuentaCobrar> listarTodas() {
        return cuentaCobrarRepository.findAllByOrderByIdDesc();
    }

    public List<CuentaCobrar> listarPendientes() {
        return cuentaCobrarRepository.findByEstadoInOrderByIdDesc(List.of("PENDIENTE", "PARCIAL", "VENCIDO"));
    }

    public Optional<CuentaCobrar> obtenerPorId(Long id) {
        return cuentaCobrarRepository.findById(id);
    }

    @Transactional
    public CuentaCobrar generarDesdeVenta(Long ventaId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new IllegalArgumentException("Venta no encontrada"));

        if (venta.getEstado() != null && venta.getEstado() == 0) {
            throw new IllegalArgumentException("No se puede generar cuenta de una venta anulada");
        }

        cuentaCobrarRepository.findByVentaId(ventaId).ifPresent(c -> {
            throw new IllegalArgumentException("Esta venta ya tiene una cuenta por cobrar");
        });

        Cliente cliente = venta.getCliente();
        if (cliente == null) {
            throw new IllegalArgumentException("La venta no tiene cliente asociado");
        }

        CuentaCobrar cuenta = new CuentaCobrar();
        cuenta.setCliente(cliente);
        cuenta.setVenta(venta);
        cuenta.setSaldoPendiente(venta.getTotal());
        cuenta.setEstado("PENDIENTE");
        cuenta.setFechaCreacion(java.time.LocalDateTime.now());
        cuenta.setFechaPago(java.time.LocalDate.now().plusDays(30));

        CuentaCobrar guardada = cuentaCobrarRepository.save(cuenta);
        notificacionService.notificarCuentaCobrar(guardada);
        return guardada;
    }

    @Transactional
    public CuentaCobrar registrarPago(Long id, Double monto, Double montoEfectivo, Double montoYape, Double montoTransferencia, Double montoTarjeta) {
        if (monto == null || monto <= 0) {
            throw new IllegalArgumentException("Ingrese un monto válido mayor a cero");
        }

        CuentaCobrar cuenta = cuentaCobrarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada"));

        if ("PAGADO".equals(cuenta.getEstado())) {
            throw new IllegalArgumentException("Esta cuenta ya está pagada");
        }

        double saldo = Math.round((cuenta.getSaldoPendiente() - monto) * 100.0) / 100.0;
        if (saldo < 0) {
            throw new IllegalArgumentException("El monto supera el saldo pendiente");
        }

        cuenta.setSaldoPendiente(saldo);
        cuenta.setEstado(saldo == 0 ? "PAGADO" : "PARCIAL");

        // Update the associated Venta's payment details
        Venta venta = cuenta.getVenta();
        if (venta != null) {
            double ef = montoEfectivo != null ? montoEfectivo : 0.0;
            double yp = montoYape != null ? montoYape : 0.0;
            double tr = montoTransferencia != null ? montoTransferencia : 0.0;
            double tj = montoTarjeta != null ? montoTarjeta : 0.0;

            venta.setMontoEfectivo((venta.getMontoEfectivo() != null ? venta.getMontoEfectivo() : 0.0) + ef);
            venta.setMontoYape((venta.getMontoYape() != null ? venta.getMontoYape() : 0.0) + yp);
            venta.setMontoTransferencia((venta.getMontoTransferencia() != null ? venta.getMontoTransferencia() : 0.0) + tr);
            venta.setMontoTarjeta((venta.getMontoTarjeta() != null ? venta.getMontoTarjeta() : 0.0) + tj);

            // Update payment method based on active amounts
            java.util.List<String> activeMethods = new java.util.ArrayList<>();
            if (venta.getMontoEfectivo() > 0) activeMethods.add("EFECTIVO");
            if (venta.getMontoYape() > 0) activeMethods.add("YAPE");
            if (venta.getMontoTransferencia() > 0) activeMethods.add("TRANSFERENCIA");
            if (venta.getMontoTarjeta() > 0) activeMethods.add("TARJETA");

            if (activeMethods.size() > 1) {
                venta.setMetodoPago("MIXTO");
            } else if (activeMethods.size() == 1) {
                venta.setMetodoPago(activeMethods.get(0));
            } else {
                venta.setMetodoPago("EFECTIVO");
            }
            ventaRepository.save(venta);
        }

        return cuentaCobrarRepository.save(cuenta);
    }

    @Transactional
    public CuentaCobrar registrarPago(Long id, Double monto) {
        return registrarPago(id, monto, monto, 0.0, 0.0, 0.0);
    }

    @Transactional
    public void marcarVencida(Long id) {
        CuentaCobrar cuenta = cuentaCobrarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada"));
        if (!"PAGADO".equals(cuenta.getEstado())) {
            cuenta.setEstado("VENCIDO");
            CuentaCobrar guardada = cuentaCobrarRepository.save(cuenta);
            notificacionService.notificarCuentaCobrarVencida(guardada);
        }
    }
}
