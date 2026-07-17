package com.example.acceso.controller;

import com.example.acceso.model.Perfil;
import com.example.acceso.service.PerfilService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/perfiles")
public class PerfilController {

    private final PerfilService perfilService;

    public PerfilController(PerfilService perfilService) {
        this.perfilService = perfilService;
    }

    @GetMapping("/listar")
    public String mostrarPaginaPerfiles() {
        return "perfiles"; // Devuelve el nombre de la vista (perfiles.html)
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarPerfilesApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", perfilService.listarTodosLosPerfiles());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtenerPerfil(@PathVariable Long id) {
        return perfilService.obtenerPerfilPorId(id)
                .map(perfil -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", true);
                    // Preparamos los datos para el frontend
                    Map<String, Object> perfilData = new HashMap<>();
                    perfilData.put("id", perfil.getId());
                    perfilData.put("nombre", perfil.getNombre());
                    perfilData.put("descripcion", perfil.getDescripcion());
                    perfilData.put("estado", perfil.getEstado());
                    perfilData.put("opciones",
                            perfil.getOpciones().stream().map(op -> op.getId()).collect(Collectors.toSet()));

                    response.put("data", perfilData);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarPerfil(@RequestBody Perfil perfil) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean esNuevo = (perfil.getId() == null);
            Perfil perfilGuardado = perfilService.guardarPerfil(perfil);
            response.put("success", true);
            response.put("message", esNuevo ? "Perfil creado correctamente" : "Perfil actualizado correctamente");
            response.put("perfil", perfilGuardado);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al guardar el perfil: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/api/cambiar-estado/{id}")
    @ResponseBody
    public ResponseEntity<?> cambiarEstadoPerfil(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        return perfilService.cambiarEstadoPerfil(id)
                .map(perfil -> {
                    response.put("success", true);
                    response.put("message", "Estado del perfil actualizado");
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Perfil no encontrado");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                });
    }

    @GetMapping("/api/opciones")
    @ResponseBody
    public ResponseEntity<?> listarOpcionesApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", perfilService.listarTodasLasOpciones());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarPerfil(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Opcional: Añadir validación para no poder eliminar perfiles en uso.
            // if (usuarioService.existeUsuarioConPerfil(id)) {
            // response.put("success", false);
            // response.put("message", "No se puede eliminar el perfil porque está asignado
            // a uno o más usuarios.");
            // return ResponseEntity.badRequest().body(response);
            // }
            perfilService.eliminarPerfil(id);
            response.put("success", true);
            response.put("message", "Perfil eliminado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar el perfil: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}