package com.example.acceso.controller;

import com.example.acceso.model.Usuario;
import com.example.acceso.service.PerfilService;
import com.example.acceso.service.UsuarioService;
import org.springframework.stereotype.Controller;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// @Controller: Indica que esta clase es un controlador web.
// @RequestMapping("/usuarios"): Todas las rutas de este controlador empezarán con "/usuarios".
@Controller
@RequestMapping("/usuarios")
public class UsuarioController {
    // Inyección del servicio de usuario.
    private final UsuarioService usuarioService;
    private final PerfilService perfilService;

    public UsuarioController(UsuarioService usuarioService, PerfilService perfilService) {
        this.usuarioService = usuarioService;
        this.perfilService = perfilService;
    }

    // GET /usuarios/listar: Muestra la página HTML principal de gestión de
    // usuarios.
    @GetMapping("/listar")
    public String listarUsuarios(Model model) {
        // Aunque el listado se hace por API, este método prepara el modelo inicial
        // y carga los datos necesarios para los modales (ej. lista de perfiles).
        List<Usuario> usuarios = usuarioService.listarUsuarios();
        model.addAttribute("usuarios", usuarios);
        model.addAttribute("formUsuario", new Usuario());
        return "usuarios";
    }

    // GET /usuarios/api/listar: Endpoint de la API que devuelve la lista de
    // usuarios en formato JSON.
    // @ResponseBody: Indica que el valor de retorno del método debe ser el cuerpo
    // de la respuesta, no el nombre de una vista.
    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarUsuariosApi() {
        Map<String, Object> response = new HashMap<>();
        List<Usuario> usuarios = usuarioService.listarUsuarios();
        response.put("success", true);
        response.put("data", usuarios);
        return ResponseEntity.ok(response);
    }

    // GET /usuarios/api/perfiles: Endpoint para obtener la lista de perfiles
    // activos.
    @GetMapping("/api/perfiles")
    @ResponseBody
    public ResponseEntity<?> listarPerfilesActivosApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", perfilService.listarPerfilesActivos());
        return ResponseEntity.ok(response);
    }

    // POST /usuarios/api/guardar: Endpoint para crear o actualizar un usuario.
    // @RequestBody: Convierte el cuerpo JSON de la petición en un objeto Usuario.
    // @Valid: Activa las validaciones definidas en el modelo Usuario (ej.
    // @NotBlank).
    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardarUsuarioAjax(@Valid @RequestBody Usuario usuario, BindingResult bindingResult) {
        Map<String, Object> response = new HashMap<>();

        // Si hay errores de validación (ej. un campo obligatorio está vacío).
        if (bindingResult.hasErrors()) {
            // Recopila los errores y los devuelve en la respuesta JSON.
            Map<String, String> errores = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> errores.put(error.getField(), error.getDefaultMessage()));
            response.put("success", false);
            response.put("message", "Datos inválidos");
            response.put("errors", errores);
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // Llama al servicio para guardar el usuario.
            Usuario usuarioGuardado = usuarioService.guardarUsuario(usuario);
            response.put("success", true);
            response.put("usuario", usuarioGuardado);
            response.put("message",
                    usuario.getId() != null ? "Usuario actualizado correctamente" : "Usuario creado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Captura cualquier excepción del servicio (ej. usuario duplicado) y la
            // devuelve como error.
            response.put("success", false);
            response.put("message", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/api/{id}")
    // GET /usuarios/api/{id}: Devuelve los datos de un único usuario por su ID.
    // @PathVariable: Extrae el valor del ID de la URL.
    @ResponseBody
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        try {
            return usuarioService.obtenerUsuarioPorId(id).map(usuario -> {
                // Si el usuario se encuentra, lo envuelve en una respuesta exitosa.
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("data", usuario);
                return ResponseEntity.ok(response);
            }).orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error al obtener usuario: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // DELETE /usuarios/api/eliminar/{id}: Realiza el borrado lógico de un usuario.
    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminarUsuarioAjax(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Buena práctica: verificar si el usuario existe antes de intentar eliminarlo.
            if (!usuarioService.obtenerUsuarioPorId(id).isPresent()) {
                response.put("success", false);
                response.put("message", "Usuario no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            usuarioService.eliminarUsuario(id);
            response.put("success", true);
            response.put("message", "Usuario eliminado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar usuario: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // POST /usuarios/api/cambiar-estado/{id}: Activa o desactiva un usuario.
    @PostMapping("/api/cambiar-estado/{id}")
    @ResponseBody
    public ResponseEntity<?> cambiarEstadoUsuarioAjax(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Llama al servicio para cambiar el estado.
            return usuarioService.cambiarEstadoUsuario(id)
                    .map(usuario -> {
                        response.put("success", true);
                        response.put("usuario", usuario);
                        response.put("message", "Estado del usuario actualizado correctamente");
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        // Si el servicio no encuentra el usuario, devuelve un error 404.
                        response.put("success", false);
                        response.put("message", "Usuario no encontrado");
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                    });
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al cambiar estado: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}