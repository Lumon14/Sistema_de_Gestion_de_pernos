package com.example.acceso.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;

@Controller
public class CatalogoController {

    @GetMapping("/catalogo")
    public String mostrarCatalogo(Model model) {
        return "catalogo";
    }
}
