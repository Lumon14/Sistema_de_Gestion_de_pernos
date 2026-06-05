package com.example.acceso.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class ConsultaService {

    @Value("${consulta.api.token:}")
    private String apiToken;

    @Value("${consulta.api.proveedor:decolecta}")
    private String proveedor;

    @Value("${consulta.api.url:https://api.decolecta.com/v1}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public Map<String, Object> consultarDocumento(String documento) {
        String doc = documento != null ? documento.trim() : "";
        if (doc.length() == 8) {
            return consultarDni(doc);
        }
        if (doc.length() == 11) {
            return consultarRuc(doc);
        }
        return error("Ingrese un DNI (8 dígitos) o RUC (11 dígitos) válido");
    }

    public Map<String, Object> consultarDni(String dni) {
        if (!tieneTokenConfigurado()) {
            return error("Servicio RENIEC no configurado. Configure consulta.api.token en application.properties");
        }

        if ("apisperu".equalsIgnoreCase(proveedor)) {
            return consultarDniApisPeru(dni);
        }
        return consultarDniDecolecta(dni);
    }

    public Map<String, Object> consultarRuc(String ruc) {
        if (!tieneTokenConfigurado()) {
            return error("Servicio SUNAT no configurado. Configure consulta.api.token en application.properties");
        }

        if ("apisperu".equalsIgnoreCase(proveedor)) {
            return consultarRucApisPeru(ruc);
        }
        return consultarRucDecolecta(ruc);
    }

    private Map<String, Object> consultarDniDecolecta(String dni) {
        try {
            String url = apiUrl + "/reniec/dni?numero=" + dni;
            Map<String, Object> response = ejecutarConsultaConBearer(url);
            return parsearRespuestaDni(response, dni);
        } catch (HttpClientErrorException.NotFound e) {
            return error("El DNI ingresado no fue encontrado en RENIEC");
        } catch (HttpClientErrorException e) {
            return error("No se pudo consultar el DNI: " + extraerMensajeError(e));
        } catch (Exception e) {
            return error("Error al consultar DNI en RENIEC: " + e.getMessage());
        }
    }

    private Map<String, Object> consultarRucDecolecta(String ruc) {
        try {
            String url = apiUrl + "/sunat/ruc?numero=" + ruc;
            Map<String, Object> response = ejecutarConsultaConBearer(url);
            return parsearRespuestaRuc(response, ruc);
        } catch (HttpClientErrorException.NotFound e) {
            return error("El RUC ingresado no fue encontrado en SUNAT");
        } catch (HttpClientErrorException e) {
            return error("No se pudo consultar el RUC: " + extraerMensajeError(e));
        } catch (Exception e) {
            return error("Error al consultar RUC en SUNAT: " + e.getMessage());
        }
    }

    private Map<String, Object> consultarDniApisPeru(String dni) {
        try {
            String url = apiUrl + "/dni/" + dni + "?token=" + apiToken;
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            return parsearRespuestaDni(response, dni);
        } catch (Exception e) {
            return error("Error al consultar DNI: " + e.getMessage());
        }
    }

    private Map<String, Object> consultarRucApisPeru(String ruc) {
        try {
            String url = apiUrl + "/ruc/" + ruc + "?token=" + apiToken;
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            return parsearRespuestaRuc(response, ruc);
        } catch (Exception e) {
            return error("Error al consultar RUC: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> ejecutarConsultaConBearer(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiToken);
        headers.set("Accept", "application/json");
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
        return response.getBody();
    }

    private boolean tieneTokenConfigurado() {
        return apiToken != null && !apiToken.isBlank() && !"tu_token_aqui".equals(apiToken);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parsearRespuestaDni(Map<String, Object> response, String dni) {
        if (response == null) {
            return error("No se recibió respuesta del servicio RENIEC");
        }

        Map<String, Object> data = response;
        if (response.containsKey("data") && response.get("data") instanceof Map) {
            data = (Map<String, Object>) response.get("data");
        }

        String nombre = construirNombreCompleto(data);
        if (nombre == null || nombre.isBlank()) {
            return error("No se encontró el nombre para el DNI ingresado");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("nombre", nombre);
        result.put("dniRuc", dni);
        result.put("tipoDocumento", "DNI");
        result.put("origen", "reniec");
        result.put("message", "Nombre obtenido de RENIEC");
        return result;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parsearRespuestaRuc(Map<String, Object> response, String ruc) {
        if (response == null) {
            return error("No se recibió respuesta del servicio SUNAT");
        }

        Map<String, Object> data = response;
        if (response.containsKey("data") && response.get("data") instanceof Map) {
            data = (Map<String, Object>) response.get("data");
        }

        String nombre = extraerTexto(data,
                "razonSocial", "razon_social", "nombreComercial", "nombre_comercial",
                "nombre", "nombre_completo", "full_name");
        String direccion = extraerTexto(data, "direccion");

        if (nombre == null || nombre.isBlank()) {
            return error("No se encontró el nombre para el RUC ingresado");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("nombre", nombre);
        result.put("direccion", direccion);
        result.put("dniRuc", ruc);
        result.put("tipoDocumento", "RUC");
        result.put("origen", "sunat");
        result.put("message", "Nombre obtenido de SUNAT");
        return result;
    }

    private String construirNombreCompleto(Map<String, Object> data) {
        String nombres = extraerTexto(data,
                "first_name", "nombres", "nombresCompletos", "nombre");
        String apPaterno = extraerTexto(data,
                "first_last_name", "apellidoPaterno", "apellido_paterno");
        String apMaterno = extraerTexto(data,
                "second_last_name", "apellidoMaterno", "apellido_materno");

        if (nombres != null || apPaterno != null || apMaterno != null) {
            return String.join(" ",
                    nombres != null ? nombres : "",
                    apPaterno != null ? apPaterno : "",
                    apMaterno != null ? apMaterno : "").trim().replaceAll("\\s+", " ");
        }

        String nombreCompleto = extraerTexto(data,
                "full_name", "nombre_completo", "nombreCompleto", "razonSocial");
        if (nombreCompleto != null && !esNombreSimulado(nombreCompleto)) {
            return formatearNombreDesdeFullName(nombreCompleto);
        }

        return null;
    }

    private String formatearNombreDesdeFullName(String fullName) {
        if (fullName.contains(",")) {
            String[] partes = fullName.split(",", 2);
            String apellidos = partes[0].trim();
            String nombres = partes.length > 1 ? partes[1].trim() : "";
            return (nombres + " " + apellidos).trim().replaceAll("\\s+", " ");
        }

        String[] palabras = fullName.trim().split("\\s+");
        if (palabras.length >= 3) {
            String apPaterno = palabras[0];
            String apMaterno = palabras[1];
            String nombres = String.join(" ",
                    java.util.Arrays.copyOfRange(palabras, 2, palabras.length));
            return (nombres + " " + apPaterno + " " + apMaterno).trim().replaceAll("\\s+", " ");
        }

        return fullName.trim();
    }

    public boolean esNombreSimulado(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            return true;
        }
        String upper = nombre.toUpperCase();
        return upper.startsWith("CLIENTE DNI") || upper.startsWith("EMPRESA RUC");
    }

    private String extraerTexto(Map<String, Object> data, String... claves) {
        for (String clave : claves) {
            Object valor = data.get(clave);
            if (valor == null) {
                valor = data.get(clave.toLowerCase());
            }
            if (valor != null && !valor.toString().isBlank()) {
                return valor.toString().trim();
            }
        }
        return null;
    }

    private String extraerMensajeError(HttpClientErrorException e) {
        String body = e.getResponseBodyAsString();
        if (body != null && !body.isBlank()) {
            return body.length() > 120 ? body.substring(0, 120) + "..." : body;
        }
        return e.getStatusText();
    }

    private Map<String, Object> error(String mensaje) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("message", mensaje);
        return result;
    }
}
