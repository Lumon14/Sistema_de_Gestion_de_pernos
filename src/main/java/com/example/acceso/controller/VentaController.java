package com.example.acceso.controller;

import com.example.acceso.model.Usuario;
import com.example.acceso.model.Venta;
import com.example.acceso.service.ProductoService;
import com.example.acceso.service.UsuarioService;
import com.example.acceso.service.VentaService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/ventas")
public class VentaController {

    private final VentaService ventaService;
    private final ProductoService productoService;
    private final UsuarioService usuarioService;

    public VentaController(VentaService ventaService, ProductoService productoService, UsuarioService usuarioService) {
        this.ventaService = ventaService;
        this.productoService = productoService;
        this.usuarioService = usuarioService;
    }

    @GetMapping("/listar")
    public String listar(Model model) {
        model.addAttribute("productos", productoService.listarActivos());
        return "ventas";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", ventaService.listarTodas());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(@RequestBody Venta venta) {
        try {
            // Asignar el usuario autenticado
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Usuario usuario = usuarioService.findByUsuario(username).orElse(null);
            venta.setUsuario(usuario);

            Venta guardada = ventaService.registrarVenta(venta);
            return ResponseEntity.ok(Map.of("success", true, "data", guardada, "message", "Venta procesada con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return ventaService.obtenerPorId(id)
                .map(v -> ResponseEntity.ok(Map.of("success", true, "data", v)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        try {
            ventaService.cancelarVenta(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Venta cancelada y stock devuelto"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
