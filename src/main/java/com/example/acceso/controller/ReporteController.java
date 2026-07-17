package com.example.acceso.controller;

import com.example.acceso.model.CajaSesion;
import com.example.acceso.model.Venta;
import com.example.acceso.service.CajaService;
import com.example.acceso.service.ReporteService;
import com.example.acceso.service.VentaService;
import com.example.acceso.repository.VentaRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/reportes")
public class ReporteController {

    private final VentaRepository ventaRepository;
    private final ReporteService reporteService;
    private final CajaService cajaService;

    public ReporteController(VentaRepository ventaRepository, ReporteService reporteService, CajaService cajaService) {
        this.ventaRepository = ventaRepository;
        this.reporteService = reporteService;
        this.cajaService = cajaService;
    }

    @GetMapping("/listar")
    public String listarReportes(Model model) {
        return "reportes";
    }

    @GetMapping("/api/ventas")
    @ResponseBody
    public ResponseEntity<?> obtenerVentasFiltradas(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String metodoPago,
            @RequestParam(required = false) String estado) {
        try {
            List<Venta> ventas = filtrarVentasInterno(fechaInicio, fechaFin, metodoPago, estado);
            return ResponseEntity.ok(Map.of("success", true, "data", ventas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/ventas/exportar/excel")
    public ResponseEntity<byte[]> exportarExcelVentas(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String metodoPago,
            @RequestParam(required = false) String estado) {
        List<Venta> ventas = filtrarVentasInterno(fechaInicio, fechaFin, metodoPago, estado);
        byte[] data = reporteService.generarExcelVentas(ventas);
        String filename = "reporte_ventas_" + LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/ventas/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdfVentas(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin,
            @RequestParam(required = false) String metodoPago,
            @RequestParam(required = false) String estado) {
        List<Venta> ventas = filtrarVentasInterno(fechaInicio, fechaFin, metodoPago, estado);
        byte[] data = reporteService.generarPdfVentas(ventas);
        String filename = "reporte_ventas_" + LocalDate.now() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/cajas/exportar/excel")
    public ResponseEntity<byte[]> exportarExcelCajas() {
        List<CajaSesion> sesiones = cajaService.listarTodas();
        byte[] data = reporteService.generarExcelCajas(sesiones, cajaService);
        String filename = "reporte_cajas_" + LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/cajas/exportar/pdf")
    public ResponseEntity<byte[]> exportarPdfCajas() {
        List<CajaSesion> sesiones = cajaService.listarTodas();
        byte[] data = reporteService.generarPdfCajas(sesiones, cajaService);
        String filename = "reporte_cajas_" + LocalDate.now() + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    private List<Venta> filtrarVentasInterno(String fechaInicio, String fechaFin, String metodoPago, String estado) {
        LocalDateTime start = (fechaInicio != null && !fechaInicio.isBlank()) 
                ? LocalDate.parse(fechaInicio).atStartOfDay() 
                : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = (fechaFin != null && !fechaFin.isBlank()) 
                ? LocalDate.parse(fechaFin).atTime(23, 59, 59) 
                : LocalDateTime.now();

        boolean filterByMetodo = (metodoPago != null && !metodoPago.isBlank() && !metodoPago.equalsIgnoreCase("TODOS"));
        boolean filterByEstado = (estado != null && !estado.isBlank() && !estado.equalsIgnoreCase("TODOS"));

        if (filterByMetodo && filterByEstado) {
            Integer estVal = Integer.parseInt(estado);
            if (metodoPago.equalsIgnoreCase("ONLINE")) {
                return ventaRepository.findByFechaBetweenAndMetodoPagoNotEfectivoAndEstadoOrderByFechaDesc(start, end, estVal);
            }
            return ventaRepository.findByFechaBetweenAndMetodoPagoAndEstadoOrderByFechaDesc(start, end, metodoPago, estVal);
        } else if (filterByMetodo) {
            if (metodoPago.equalsIgnoreCase("ONLINE")) {
                return ventaRepository.findByFechaBetweenAndMetodoPagoNotEfectivoOrderByFechaDesc(start, end);
            }
            return ventaRepository.findByFechaBetweenAndMetodoPagoOrderByFechaDesc(start, end, metodoPago);
        } else if (filterByEstado) {
            Integer estVal = Integer.parseInt(estado);
            return ventaRepository.findByFechaBetweenAndEstadoOrderByFechaDesc(start, end, estVal);
        } else {
            return ventaRepository.findByFechaBetweenOrderByFechaDesc(start, end);
        }
    }
}
