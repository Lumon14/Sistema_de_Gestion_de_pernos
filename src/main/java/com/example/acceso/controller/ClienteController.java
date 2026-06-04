package com.example.acceso.controller;

import com.example.acceso.model.Cliente;
import com.example.acceso.service.ClienteService;
import com.example.acceso.service.ConsultaService;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService clienteService;
    private final ConsultaService consultaService;

    public ClienteController(ClienteService clienteService, ConsultaService consultaService) {
        this.clienteService = clienteService;
        this.consultaService = consultaService;
    }

    @GetMapping("/listar")
    public String listar() {
        return "clientes";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", clienteService.listarTodos());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(@RequestBody Cliente cliente) {
        try {
            Cliente guardado = clienteService.guardar(cliente);
            return ResponseEntity
                    .ok(Map.of("success", true, "data", guardado, "message", "Cliente guardado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return clienteService.obtenerPorId(id)
                .map(c -> ResponseEntity.ok(Map.of("success", true, "data", c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/buscar/{dniRuc}")
    @ResponseBody
    public ResponseEntity<?> buscarPorDniRuc(@PathVariable String dniRuc) {
        return clienteService.obtenerPorDniRuc(dniRuc)
                .map(c -> ResponseEntity.ok(Map.of("success", true, "data", c)))
                .orElse(ResponseEntity.ok(Map.of("success", false, "message", "Cliente no encontrado")));
    }

    @GetMapping("/api/consultar-externo/{dni}")
    @ResponseBody
    public ResponseEntity<?> consultarExterno(@PathVariable String dni) {
        Map<String, Object> data = consultaService.consultarDni(dni);
        return ResponseEntity.ok(data);
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            clienteService.eliminar(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Cliente desactivado"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/api/{id}/email")
    @ResponseBody
    public ResponseEntity<?> actualizarEmail(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String nuevoEmail = body.get("email");
            if (nuevoEmail == null || nuevoEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "El correo no puede estar vacío"));
            }
            Cliente cliente = clienteService.obtenerPorId(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
            cliente.setEmail(nuevoEmail);
            clienteService.guardar(cliente);
            return ResponseEntity.ok(Map.of("success", true, "message", "Correo actualizado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
