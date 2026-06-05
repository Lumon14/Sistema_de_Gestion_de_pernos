package com.example.acceso.controller;

import com.example.acceso.repository.DetalleVentaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventario")
public class InventarioApiController {

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @GetMapping("/producto/{id}/ventas")
    public ResponseEntity<List<Map<String, Object>>> obtenerHistorialVentas(@PathVariable Long id) {
        List<Map<String, Object>> historial = detalleVentaRepository.findHistorialVentasPorProductoNative(id);
        return ResponseEntity.ok(historial);
    }
}