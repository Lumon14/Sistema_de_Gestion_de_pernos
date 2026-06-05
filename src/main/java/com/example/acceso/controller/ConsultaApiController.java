package com.example.acceso.controller;

import com.example.acceso.model.Cliente;
import com.example.acceso.service.ClienteService;
import com.example.acceso.service.ConsultaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/consulta")
public class ConsultaApiController {

    private final ConsultaService consultaService;
    private final ClienteService clienteService;

    public ConsultaApiController(ConsultaService consultaService, ClienteService clienteService) {
        this.consultaService = consultaService;
        this.clienteService = clienteService;
    }

    @GetMapping("/{documento}")
    public ResponseEntity<?> consultar(@PathVariable String documento) {
        String doc = documento.trim();
        Map<String, Object> resultadoExterno = consultaService.consultarDocumento(doc);
        Optional<Cliente> clienteLocal = clienteService.obtenerPorDniRuc(doc);

        if (clienteLocal.isPresent() && !consultaService.esNombreSimulado(clienteLocal.get().getNombre())) {
            Cliente c = clienteLocal.get();
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("dniRuc", c.getDniRuc());
            result.put("tipoDocumento", doc.length() == 11 ? "RUC" : "DNI");
            result.put("origen", "registro_local");

            String nombre = c.getNombre();
            if (Boolean.TRUE.equals(resultadoExterno.get("success")) && resultadoExterno.get("nombre") != null) {
                nombre = resultadoExterno.get("nombre").toString();
                result.put("origen", resultadoExterno.get("origen"));
                result.put("message", resultadoExterno.get("message"));
            } else {
                result.put("message", "Cliente encontrado en el sistema");
            }

            result.put("nombre", nombre);
            result.put("telefono", c.getTelefono());
            result.put("email", c.getEmail());
            result.put("direccion", c.getDireccion());
            return ResponseEntity.ok(result);
        }

        return ResponseEntity.ok(resultadoExterno);
    }
}
