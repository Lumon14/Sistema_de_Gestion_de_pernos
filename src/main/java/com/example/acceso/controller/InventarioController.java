package com.example.acceso.controller;

import com.example.acceso.model.Producto;
import com.example.acceso.service.ProductoService;
import com.example.acceso.service.CategoriaService;
import com.example.acceso.service.ProveedorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Controller
@RequestMapping("/inventario")
public class InventarioController {

    private final ProductoService productoService;
    private final CategoriaService categoriaService;
    private final ProveedorService proveedorService;

    public InventarioController(ProductoService productoService, CategoriaService categoriaService,
            ProveedorService proveedorService) {
        this.productoService = productoService;
        this.categoriaService = categoriaService;
        this.proveedorService = proveedorService;
    }

    // 1. Renderiza la página HTML principal del inventario
    @GetMapping("/listar")
    public String listar(Model model) {
        model.addAttribute("categorias", categoriaService.listarActivas());
        model.addAttribute("proveedores", proveedorService.listarActivos());
        return "inventario"; // Debe existir inventario.html en templates
    }

    // 2. API JSON para llenar la tabla de inventario
    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", productoService.listarTodos());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/api/actualizar-stock/{id}")
    @ResponseBody
    public ResponseEntity<?> actualizarStock(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        try {
            String operacion = (String) body.getOrDefault("operacion", "establecer");
            int cantidad = Integer.parseInt(body.get("cantidad").toString());
            Producto actualizado = productoService.actualizarStock(id, cantidad, operacion);
            response.put("success", true);
            response.put("data", actualizado);
            response.put("message", "Stock actualizado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar stock: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // 3. API JSON para obtener el historial detallado de ventas por producto
    @GetMapping("/api/{id}/historial-ventas")
    @ResponseBody
    public ResponseEntity<?> obtenerHistorialVentas(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Map<String, Object>> historial = productoService.obtenerHistorialVentas(id);
            response.put("success", true);
            response.put("data", historial);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener historial: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

}
