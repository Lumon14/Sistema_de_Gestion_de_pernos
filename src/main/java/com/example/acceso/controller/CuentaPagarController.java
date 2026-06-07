package com.example.acceso.controller;

import com.example.acceso.dto.RegistrarPagoRequest;
import com.example.acceso.model.CuentaPagar;
import com.example.acceso.service.CuentaPagarService;
import com.example.acceso.service.ProveedorService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/cuentas-pagar")
public class CuentaPagarController {

    private final CuentaPagarService cuentaPagarService;
    private final ProveedorService proveedorService;

    public CuentaPagarController(CuentaPagarService cuentaPagarService, ProveedorService proveedorService) {
        this.cuentaPagarService = cuentaPagarService;
        this.proveedorService = proveedorService;
    }

    @GetMapping("/listar")
    public String listar(Model model) {
        model.addAttribute("proveedores", proveedorService.listarActivos());
        return "cuentas-pagar";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", cuentaPagarService.listarTodas());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(@RequestBody CuentaPagar cuenta) {
        try {
            CuentaPagar guardada = cuentaPagarService.registrar(cuenta);
            return ResponseEntity.ok(Map.of("success", true, "data", guardada, "message", "Obligación registrada"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/{id}/registrar-pago")
    @ResponseBody
    public ResponseEntity<?> registrarPago(@PathVariable Long id, @RequestBody RegistrarPagoRequest request) {
        try {
            CuentaPagar cuenta = cuentaPagarService.registrarPago(id, request.getMonto());
            return ResponseEntity.ok(Map.of("success", true, "data", cuenta, "message", "Pago registrado al proveedor"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
