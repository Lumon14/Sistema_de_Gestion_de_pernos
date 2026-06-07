package com.example.acceso.controller;

import com.example.acceso.dto.CanjearNotaVentaRequest;
import com.example.acceso.model.TipoComprobanteVenta;
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
    public String redirectNotas() {
        return "redirect:/ventas/notas/listar";
    }

    @GetMapping("/notas/listar")
    public String listarNotas(Model model) {
        model.addAttribute("productos", productoService.listarActivos());
        model.addAttribute("tipoVista", "notas");
        return "ventas/notas";
    }

    @GetMapping("/boletas/listar")
    public String listarBoletas(Model model) {
        model.addAttribute("tipoVista", "boletas");
        return "ventas/boletas";
    }

    @GetMapping("/facturas/listar")
    public String listarFacturas(Model model) {
        model.addAttribute("tipoVista", "facturas");
        return "ventas/facturas";
    }

    @GetMapping("/api/notas/listar")
    @ResponseBody
    public ResponseEntity<?> listarNotasApi() {
        return okList(ventaService.listarPorTipo(TipoComprobanteVenta.NOTA));
    }

    @GetMapping("/api/boletas/listar")
    @ResponseBody
    public ResponseEntity<?> listarBoletasApi() {
        return okList(ventaService.listarPorTipo(TipoComprobanteVenta.BOLETA));
    }

    @GetMapping("/api/facturas/listar")
    @ResponseBody
    public ResponseEntity<?> listarFacturasApi() {
        return okList(ventaService.listarPorTipo(TipoComprobanteVenta.FACTURA));
    }

    /** Compatibilidad con frontend anterior */
    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        return okList(ventaService.listarTodas());
    }

    @PostMapping("/api/notas/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarNota(@RequestBody Venta venta) {
        return guardarInterno(venta, true);
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(@RequestBody Venta venta) {
        return guardarInterno(venta, true);
    }

    @PostMapping("/api/notas-venta/{id}/canjear")
    @ResponseBody
    public ResponseEntity<?> canjearNota(@PathVariable Long id, @RequestBody CanjearNotaVentaRequest request) {
        try {
            Usuario usuario = obtenerUsuarioAutenticado();
            Venta comprobante = ventaService.canjearNotaVenta(id, request, usuario);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "data", comprobante,
                    "message", "Nota canjeada correctamente a " + comprobante.getTipoComprobante()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return ventaService.obtenerDetalleParaApi(id)
                .map(v -> ResponseEntity.ok(Map.of("success", true, "data", v)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        try {
            ventaService.cancelarVenta(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Comprobante anulado y stock devuelto si aplica"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/notas/{id}/editar")
    @ResponseBody
    public ResponseEntity<?> editarNota(@PathVariable Long id, @RequestBody Venta venta) {
        try {
            Venta editada = ventaService.editarNotaVenta(id, venta);
            return ResponseEntity.ok(Map.of("success", true, "data", editada, "message", "Nota de venta actualizada correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private ResponseEntity<?> guardarInterno(Venta venta, boolean esNota) {
        try {
            venta.setUsuario(obtenerUsuarioAutenticado());
            Venta guardada = esNota ? ventaService.registrarNotaVenta(venta) : ventaService.registrarVenta(venta);
            return ResponseEntity.ok(Map.of("success", true, "data", guardada, "message", "Nota de venta registrada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return usuarioService.findByUsuario(auth.getName()).orElse(null);
    }

    private ResponseEntity<?> okList(java.util.List<Venta> data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return ResponseEntity.ok(response);
    }
}
