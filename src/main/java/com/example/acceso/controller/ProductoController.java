package com.example.acceso.controller;

import com.example.acceso.model.Producto;
import com.example.acceso.service.CategoriaService;
import com.example.acceso.service.ProductoService;
import com.example.acceso.service.ProveedorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoService productoService;
    private final CategoriaService categoriaService;
    private final ProveedorService proveedorService;

    public ProductoController(ProductoService productoService, CategoriaService categoriaService,
            ProveedorService proveedorService) {
        this.productoService = productoService;
        this.categoriaService = categoriaService;
        this.proveedorService = proveedorService;
    }

    @GetMapping("/listar")
    public String listar(Model model) {
        model.addAttribute("categorias", categoriaService.listarActivas());
        model.addAttribute("proveedores", proveedorService.listarActivos());
        return "productos";
    }

    @GetMapping("/api/listar")
    @ResponseBody
    public ResponseEntity<?> listarApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", productoService.listarTodos());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/catalogo")
    @ResponseBody
    public ResponseEntity<?> listarCatalogoApi() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", productoService.listarActivos());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/guardar")
    @ResponseBody
    public ResponseEntity<?> guardar(
            @RequestPart("producto") Producto producto,
            @RequestPart(value = "imagenFile", required = false) MultipartFile imagenFile) {
        Map<String, Object> response = new HashMap<>();
        try {
            if (imagenFile != null && !imagenFile.isEmpty()) {
                String fileName = UUID.randomUUID().toString() + "_" + imagenFile.getOriginalFilename();

                Path uploadPath = Paths.get("uploads/products/" + fileName);
                Files.createDirectories(uploadPath.getParent());
                Files.write(uploadPath, imagenFile.getBytes());

                try {
                    Path srcPath = Paths.get("src/main/resources/static/images/products/" + fileName);
                    Files.createDirectories(srcPath.getParent());
                    Files.write(srcPath, imagenFile.getBytes());
                } catch (Exception e) {
                    System.out.println("No se pudo guardar en src, continuando con uploads: " + e.getMessage());
                }

                producto.setImagen("/images/products/" + fileName);
            }

            Producto guardado = productoService.guardar(producto);
            response.put("success", true);
            response.put("data", guardado);
            response.put("message", "Producto guardado correctamente");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (IOException e) {
            response.put("success", false);
            response.put("message", "Error al guardar la imagen: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al guardar: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // === NUEVO: ACCIÓN EDITAR PRODUCTO ===
    @PutMapping("/api/editar/{id}")
    @ResponseBody
    public ResponseEntity<?> editar(
            @PathVariable Long id,
            @RequestPart("producto") Producto producto,
            @RequestPart(value = "imagenFile", required = false) MultipartFile imagenFile) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Nos aseguramos de que el ID de la URL se asigne al objeto que procesará el
            // servicio
            producto.setId(id);

            if (imagenFile != null && !imagenFile.isEmpty()) {
                String fileName = UUID.randomUUID().toString() + "_" + imagenFile.getOriginalFilename();
                Path uploadPath = Paths.get("uploads/products/" + fileName);
                Files.createDirectories(uploadPath.getParent());
                Files.write(uploadPath, imagenFile.getBytes());

                producto.setImagen("/images/products/" + fileName);
            }

            // Tu servicio se encarga automáticamente del mapeo y guardado
            Producto actualizado = productoService.guardar(producto);

            response.put("success", true);
            response.put("data", actualizado);
            response.put("message", "Producto actualizado correctamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/api/{id}")
    @ResponseBody
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        return productoService.obtenerPorId(id)
                .map(p -> ResponseEntity.ok(Map.of("success", true, "data", p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        try {
            productoService.eliminar(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Producto desactivado"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // === NUEVO: HISTORIAL DE VENTAS POR CADA PRODUCTO ===
    @GetMapping("/api/{id}/historial-ventas")
    @ResponseBody
    public ResponseEntity<?> obtenerHistorialVentas(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            // El servicio se encargará de hacer el query relacionando 'detalles_ventas' y
            // 'ventas'
            List<Map<String, Object>> historial = productoService.obtenerHistorialVentas(id);
            response.put("success", true);
            response.put("data", historial);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener historial: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}