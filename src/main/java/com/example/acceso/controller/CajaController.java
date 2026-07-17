package com.example.acceso.controller;

import com.example.acceso.model.CajaSesion;
import com.example.acceso.model.Usuario;
import com.example.acceso.service.CajaService;
import com.example.acceso.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/caja")
public class CajaController {

    private final CajaService cajaService;
    private final UsuarioService usuarioService;

    public CajaController(CajaService cajaService, UsuarioService usuarioService) {
        this.cajaService = cajaService;
        this.usuarioService = usuarioService;
    }

    @GetMapping("/listar")
    public String listarCaja(Model model) {
        model.addAttribute("cajaActiva", cajaService.obtenerCajaActiva().orElse(null));
        model.addAttribute("historial", cajaService.listarTodas());
        model.addAttribute("cajaService", cajaService); // para calcular totales en la vista
        return "caja";
    }

    @PostMapping("/api/abrir")
    @ResponseBody
    public ResponseEntity<?> abrirCaja(@RequestParam Double montoApertura) {
        try {
            Usuario usuario = obtenerUsuarioAutenticado();
            CajaSesion nuevaCaja = cajaService.abrirCaja(montoApertura, usuario);
            return ResponseEntity.ok(Map.of("success", true, "data", nuevaCaja, "message", "Caja abierta exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/cerrar")
    @ResponseBody
    public ResponseEntity<?> cerrarCaja(@RequestParam Double montoCierre) {
        try {
            Usuario usuario = obtenerUsuarioAutenticado();
            CajaSesion cerrada = cajaService.cerrarCaja(montoCierre, usuario);
            return ResponseEntity.ok(Map.of("success", true, "data", cerrada, "message", "Caja cerrada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/api/estado-actual")
    @ResponseBody
    public ResponseEntity<?> obtenerEstadoActual() {
        return cajaService.obtenerCajaActiva().map(c -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", c.getId());
            data.put("fechaApertura", c.getFechaApertura());
            data.put("montoApertura", c.getMontoApertura());
            data.put("usuarioApertura", c.getUsuarioApertura().getNombre());
            data.put("totalEfectivo", cajaService.calcularTotalEfectivoAcumulado(c));
            data.put("totalOnline", cajaService.calcularTotalOnlineAcumulado(c));
            data.put("estado", c.getEstado());
            return ResponseEntity.ok(Map.of("success", true, "data", data));
        }).orElse(ResponseEntity.ok(Map.of("success", true, "data", "CERRADA")));
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return usuarioService.findByUsuario(auth.getName()).orElse(null);
    }
}
