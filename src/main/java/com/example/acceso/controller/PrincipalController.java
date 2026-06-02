package com.example.acceso.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PrincipalController {
    @GetMapping("/") // La URL raíz ahora mostrará la página principal
    public String mostrarPrincipal() {
        return "principal";
    }

    @GetMapping("/nosotros")
    public String mostrarNosotros() {
        return "nosotros";
    }
}



