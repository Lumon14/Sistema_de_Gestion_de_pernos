package com.example.acceso.service;

import com.example.acceso.model.CajaSesion;
import com.example.acceso.model.Usuario;
import com.example.acceso.model.Venta;
import com.example.acceso.repository.CajaSesionRepository;
import com.example.acceso.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CajaService {

    private final CajaSesionRepository cajaSesionRepository;
    private final VentaRepository ventaRepository;

    public CajaService(CajaSesionRepository cajaSesionRepository, VentaRepository ventaRepository) {
        this.cajaSesionRepository = cajaSesionRepository;
        this.ventaRepository = ventaRepository;
    }

    public Optional<CajaSesion> obtenerCajaActiva() {
        return cajaSesionRepository.findFirstByEstadoOrderByIdDesc("ABIERTA");
    }

    public List<CajaSesion> listarTodas() {
        return cajaSesionRepository.findAllByOrderByFechaAperturaDesc();
    }

    @Transactional
    public CajaSesion abrirCaja(Double montoApertura, Usuario usuario) {
        Optional<CajaSesion> activa = obtenerCajaActiva();
        if (activa.isPresent()) {
            throw new IllegalArgumentException("Ya existe una sesión de caja abierta.");
        }
        CajaSesion caja = new CajaSesion();
        caja.setFechaApertura(LocalDateTime.now());
        caja.setMontoApertura(montoApertura);
        caja.setEstado("ABIERTA");
        caja.setUsuarioApertura(usuario);
        return cajaSesionRepository.save(caja);
    }

    @Transactional
    public CajaSesion cerrarCaja(Double montoCierre, Usuario usuario) {
        CajaSesion activa = obtenerCajaActiva()
                .orElseThrow(() -> new IllegalArgumentException("No hay ninguna sesión de caja abierta para cerrar."));
        activa.setFechaCierre(LocalDateTime.now());
        activa.setMontoCierre(montoCierre);
        activa.setEstado("CERRADA");
        activa.setUsuarioCierre(usuario);
        return cajaSesionRepository.save(activa);
    }

    public Double calcularTotalEfectivoAcumulado(CajaSesion caja) {
        if (caja == null) return 0.0;
        LocalDateTime fin = caja.getFechaCierre() != null ? caja.getFechaCierre() : LocalDateTime.now();
        List<Venta> ventas = ventaRepository.findByFechaBetweenAndEstadoOrderByFechaDesc(
                caja.getFechaApertura(), fin, 1
        );
        double totalVentasEfectivo = ventas.stream()
                .mapToDouble(v -> v.getMontoEfectivo() != null ? v.getMontoEfectivo() : 0.0)
                .sum();
        return caja.getMontoApertura() + totalVentasEfectivo;
    }

    public Double calcularTotalOnlineAcumulado(CajaSesion caja) {
        if (caja == null) return 0.0;
        LocalDateTime fin = caja.getFechaCierre() != null ? caja.getFechaCierre() : LocalDateTime.now();
        
        List<Venta> todasLasVentas = ventaRepository.findByFechaBetweenAndEstadoOrderByFechaDesc(
                caja.getFechaApertura(), fin, 1
        );
        return todasLasVentas.stream()
                .mapToDouble(v -> {
                    double yape = v.getMontoYape() != null ? v.getMontoYape() : 0.0;
                    double tran = v.getMontoTransferencia() != null ? v.getMontoTransferencia() : 0.0;
                    double tarj = v.getMontoTarjeta() != null ? v.getMontoTarjeta() : 0.0;
                    return yape + tran + tarj;
                })
                .sum();
    }
}
