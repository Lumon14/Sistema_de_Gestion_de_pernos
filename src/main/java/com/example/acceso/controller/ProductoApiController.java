package com.example.acceso.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.acceso.model.Producto;
import com.example.acceso.repository.ProductoRepository;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
public class ProductoApiController {

    @Autowired
    private ProductoRepository productoRepository;

    @GetMapping("/listar")
    public ResponseEntity<List<Producto>> listarProductosParaInventario() {
        List<Producto> productos = productoRepository.findAll();
        return ResponseEntity.ok(productos);
    }

}