package com.example.acceso.controller;

import com.example.acceso.model.Categoria;
import com.example.acceso.service.CategoriaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping("/listar")
    public String listar(Model model) {
        return "categorias";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", categoriaService.listarTodas());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(@RequestBody Categoria categoria) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean esNuevo = (categoria.getId() == null);
            Categoria guardada = categoriaService.guardar(categoria);
            response.put("success", true);
            response.put("data", guardada);
            response.put("message", esNuevo ? "Categoría creada correctamente" : "Categoría actualizada correctamente");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al guardar: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return categoriaService.obtenerPorId(id)
                .map(c -> ResponseEntity.ok(Map.of("success", true, "data", c)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/cambiar-estado/{id}")
    @ResponseBody
    public ResponseEntity<?> cambiarEstado(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        return categoriaService.cambiarEstado(id)
                .map(c -> {
                    response.put("success", true);
                    response.put("message", c.getEstado() == 1 ? "Categoría activada correctamente" : "Categoría inactivada correctamente");
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Categoría no encontrada");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            categoriaService.eliminar(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Categoría eliminada correctamente"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
