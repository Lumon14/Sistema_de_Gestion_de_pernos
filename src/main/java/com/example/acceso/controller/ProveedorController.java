package com.example.acceso.controller;

import com.example.acceso.model.Proveedor;
import com.example.acceso.service.ProveedorService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
            if (proveedor.getEstado() == null) proveedor.setEstado(1);
            Proveedor guardado = proveedorService.guardar(proveedor);
            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            proveedorService.eliminar(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
