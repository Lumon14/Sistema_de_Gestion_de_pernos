package com.example.acceso.service;

import com.example.acceso.model.CuentaPagar;
import com.example.acceso.model.Proveedor;
import com.example.acceso.repository.CuentaPagarRepository;
import com.example.acceso.repository.ProveedorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CuentaPagarService {

    private final CuentaPagarRepository cuentaPagarRepository;
    private final ProveedorRepository proveedorRepository;
    private final NotificacionService notificacionService;

    public CuentaPagarService(CuentaPagarRepository cuentaPagarRepository,
                              ProveedorRepository proveedorRepository,
                              NotificacionService notificacionService) {
        this.cuentaPagarRepository = cuentaPagarRepository;
        this.proveedorRepository = proveedorRepository;
        this.notificacionService = notificacionService;
    }

    public List<CuentaPagar> listarTodas() {
        return cuentaPagarRepository.findAllByOrderByIdDesc();
    }

    public List<CuentaPagar> listarPendientes() {
        return cuentaPagarRepository.findByEstadoInOrderByIdDesc(List.of("PENDIENTE", "PARCIAL", "VENCIDO"));
    }

    @Transactional
    public CuentaPagar registrar(CuentaPagar cuenta) {
        if (cuenta.getProveedor() == null || cuenta.getProveedor().getId() == null) {
            throw new IllegalArgumentException("Debe seleccionar un proveedor");
        }
        if (cuenta.getMontoTotal() == null || cuenta.getMontoTotal() <= 0) {
            throw new IllegalArgumentException("El monto total debe ser mayor a cero");
        }

        Proveedor proveedor = proveedorRepository.findById(cuenta.getProveedor().getId())
                .orElseThrow(() -> new IllegalArgumentException("Proveedor no encontrado"));

        cuenta.setProveedor(proveedor);
        cuenta.setSaldoPendiente(cuenta.getMontoTotal());
        cuenta.setEstado("PENDIENTE");
        CuentaPagar guardada = cuentaPagarRepository.save(cuenta);
        notificacionService.notificarCuentaPagar(guardada);
        return guardada;
    }

    @Transactional
    public CuentaPagar registrarPago(Long id, Double monto) {
        if (monto == null || monto <= 0) {
            throw new IllegalArgumentException("Ingrese un monto válido mayor a cero");
        }

        CuentaPagar cuenta = cuentaPagarRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada"));

        if ("PAGADO".equals(cuenta.getEstado())) {
            throw new IllegalArgumentException("Esta obligación ya está pagada");
        }

        double saldo = Math.round((cuenta.getSaldoPendiente() - monto) * 100.0) / 100.0;
        if (saldo < 0) {
            throw new IllegalArgumentException("El monto supera el saldo pendiente");
        }

        cuenta.setSaldoPendiente(saldo);
        cuenta.setEstado(saldo == 0 ? "PAGADO" : "PARCIAL");
        return cuentaPagarRepository.save(cuenta);
    }
}
