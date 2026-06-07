package com.example.acceso.controller;

import com.example.acceso.model.Usuario;
import com.example.acceso.service.NotificacionService;
import com.example.acceso.service.UsuarioService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/notificaciones")
public class NotificacionController {

    private final NotificacionService notificacionService;
    private final UsuarioService usuarioService;

    public NotificacionController(NotificacionService notificacionService, UsuarioService usuarioService) {
        this.notificacionService = notificacionService;
        this.usuarioService = usuarioService;
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listar() {
        Usuario usuario = obtenerUsuarioAutenticado();
        if (usuario == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "No autenticado"));
        }
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", notificacionService.listarRecientes(usuario.getId()));
        response.put("noLeidas", notificacionService.contarNoLeidas(usuario.getId()));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/contador")
    @ResponseBody
    public ResponseEntity<?> contador() {
        Usuario usuario = obtenerUsuarioAutenticado();
        if (usuario == null) {
            return ResponseEntity.ok(Map.of("success", true, "noLeidas", 0));
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "noLeidas", notificacionService.contarNoLeidas(usuario.getId())
        ));
    }

    @PutMapping("/api/{id}/leida")
    @ResponseBody
    public ResponseEntity<?> marcarLeida(@PathVariable Long id) {
        Usuario usuario = obtenerUsuarioAutenticado();
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        return notificacionService.marcarLeida(id, usuario.getId())
                .map(n -> ResponseEntity.ok(Map.of("success", true, "data", n)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/api/leer-todas")
    @ResponseBody
    public ResponseEntity<?> marcarTodasLeidas() {
        Usuario usuario = obtenerUsuarioAutenticado();
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        notificacionService.marcarTodasLeidas(usuario.getId());
        return ResponseEntity.ok(Map.of("success", true));
    }

    private Usuario obtenerUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return usuarioService.findByUsuario(auth.getName()).orElse(null);
    }
}
