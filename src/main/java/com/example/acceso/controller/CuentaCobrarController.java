package com.example.acceso.controller;

import com.example.acceso.dto.RegistrarPagoRequest;
import com.example.acceso.service.CuentaCobrarService;
import com.example.acceso.service.VentaService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/cuentas-cobrar")
public class CuentaCobrarController {

    private final CuentaCobrarService cuentaCobrarService;
    private final VentaService ventaService;

    public CuentaCobrarController(CuentaCobrarService cuentaCobrarService, VentaService ventaService) {
        this.cuentaCobrarService = cuentaCobrarService;
        this.ventaService = ventaService;
    }

    @GetMapping("/listar")
    public String listar(Model model) {
        return "cuentas-cobrar";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", cuentaCobrarService.listarTodas());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/ventas-disponibles")
    @ResponseBody
    public ResponseEntity<?> ventasDisponibles() {
        return ResponseEntity.ok(Map.of("success", true, "data", ventaService.listarVentasSinCuentaCobrar()));
    }

    @PostMapping("/api/generar-desde-venta/{ventaId}")
    @ResponseBody
    public ResponseEntity<?> generarDesdeVenta(@PathVariable Long ventaId) {
        try {
            var cuenta = cuentaCobrarService.generarDesdeVenta(ventaId);
            return ResponseEntity.ok(Map.of("success", true, "data", cuenta, "message", "Cuenta por cobrar generada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/{id}/registrar-pago")
    @ResponseBody
    public ResponseEntity<?> registrarPago(@PathVariable Long id, @RequestBody RegistrarPagoRequest request) {
        try {
            var cuenta = cuentaCobrarService.registrarPago(
                id, 
                request.getMonto(),
                request.getMontoEfectivo(),
                request.getMontoYape(),
                request.getMontoTransferencia(),
                request.getMontoTarjeta()
            );
            return ResponseEntity.ok(Map.of("success", true, "data", cuenta, "message", "Pago registrado"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/{id}/marcar-vencida")
    @ResponseBody
    public ResponseEntity<?> marcarVencida(@PathVariable Long id) {
        try {
            cuentaCobrarService.marcarVencida(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cuenta marcada como vencida"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
