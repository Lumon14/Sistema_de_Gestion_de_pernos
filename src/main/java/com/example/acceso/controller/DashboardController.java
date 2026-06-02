package com.example.acceso.controller;

import com.example.acceso.service.UsuarioService;
import com.example.acceso.service.ProductoService;
import com.example.acceso.service.CategoriaService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class DashboardController {

    private final UsuarioService usuarioService;
    private final ProductoService productoService;
    private final CategoriaService categoriaService;
    private final com.example.acceso.service.PedidoService pedidoService;

    public DashboardController(UsuarioService usuarioService, ProductoService productoService,
            CategoriaService categoriaService, com.example.acceso.service.PedidoService pedidoService) {
        this.usuarioService = usuarioService;
        this.productoService = productoService;
        this.categoriaService = categoriaService;
        this.pedidoService = pedidoService;
    }

    @GetMapping("/dashboard")
    public String mostrarDashboard(Model model) {
        model.addAttribute("totalUsuarios", usuarioService.contarUsuarios());
        model.addAttribute("totalProductos", productoService.contarProductos());
        model.addAttribute("totalCategorias", categoriaService.listarActivas().size());
        model.addAttribute("totalPedidosPendientes", pedidoService.contarPendientes());
        return "index";
    }

}
