package com.example.acceso.controller;

import com.example.acceso.model.Pedido;
import com.example.acceso.model.Usuario;
import com.example.acceso.model.Venta;
import com.example.acceso.service.PedidoService;
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
@RequestMapping("/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;
    private final UsuarioService usuarioService;

    public PedidoController(PedidoService pedidoService, UsuarioService usuarioService) {
        this.pedidoService = pedidoService;
        this.usuarioService = usuarioService;
    }

    @GetMapping("/listar")
    public String listar(Model model) {
        return "pedidos";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", pedidoService.listarTodos());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/registrar")
    @ResponseBody
    public ResponseEntity<?> registrar(@RequestBody Pedido pedido) {
        try {
            PedidoService.ResultadoPedido resultado = pedidoService.registrarPedido(pedido, pedido.getCliente());
            String mensaje = "Pedido registrado con éxito. " + resultado.getMensajeCliente();
            return ResponseEntity.ok(Map.of("success", true, "data", resultado.getPedido(), "message", mensaje));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/{id}/completar")
    @ResponseBody
    public ResponseEntity<?> completar(@PathVariable Long id) {
        try {
            // Obtener el usuario administrador autenticado
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String username = auth.getName();
            Usuario usuario = usuarioService.findByUsuario(username)
                    .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));

            Venta ventaGenerada = pedidoService.completarPedido(id, usuario);
            return ResponseEntity.ok(Map.of(
                    "success", true, 
                    "message", "Pedido completado con éxito. Se generó la venta #" + ventaGenerada.getNumeroComprobante(),
                    "data", ventaGenerada
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/{id}/cancelar")
    @ResponseBody
    public ResponseEntity<?> cancelar(@PathVariable Long id) {
        try {
            pedidoService.cancelarPedido(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pedido cancelado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/api/{id}/editar")
    @ResponseBody
    public ResponseEntity<?> editar(@PathVariable Long id, @RequestBody Pedido pedido) {
        try {
            Pedido editado = pedidoService.editarPedido(id, pedido);
            return ResponseEntity.ok(Map.of("success", true, "data", editado, "message", "Pedido actualizado con éxito"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
