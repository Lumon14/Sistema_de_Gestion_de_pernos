package com.example.acceso.controller;

import com.example.acceso.model.Proveedor;
import com.example.acceso.service.ProveedorService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Controller
@RequestMapping("/proveedores")
public class ProveedorController {

    private final ProveedorService proveedorService;

    public ProveedorController(ProveedorService proveedorService) {
        this.proveedorService = proveedorService;
    }

    @GetMapping("/listar")
    public String listarPage(Model model) {
        return "proveedores";
    }

    @GetMapping("/api/todos")
    @ResponseBody
    public List<Proveedor> listarApi() {
        return proveedorService.listarTodos();
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<Proveedor> obtenerPorId(@PathVariable Long id) {
        return proveedorService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(@RequestBody Proveedor proveedor) {
        try {
            boolean esNuevo = (proveedor.getId() == null);
            if (proveedor.getEstado() == null) proveedor.setEstado(1);
            Proveedor guardado = proveedorService.guardar(proveedor);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", guardado);
            response.put("message", esNuevo ? "Proveedor creado correctamente" : "Proveedor actualizado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/api/cambiar-estado/{id}")
    @ResponseBody
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        return proveedorService.cambiarEstado(id)
                .map(p -> {
                    response.put("success", true);
                    response.put("message", p.getEstado() == 1 ? "Proveedor activado correctamente" : "Proveedor inactivado correctamente");
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Proveedor no encontrado");
                    return ResponseEntity.status(404).body(response);
                });
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            proveedorService.eliminar(id);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Proveedor eliminado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
