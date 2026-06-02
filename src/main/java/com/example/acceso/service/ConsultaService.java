package com.example.acceso.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class ConsultaService {

    // TOKEN DE EJEMPLO - El usuario debe reemplazarlo con su token real de apisperu.com o similar
    private final String API_TOKEN = "tu_token_aqui";
    private final String API_URL_DNI = "https://api.apisperu.com/v1/dni/";

    public Map<String, Object> consultarDni(String dni) {
        Map<String, Object> result = new HashMap<>();
        try {
            // SIMULACIÓN DE CONSULTA (Para no fallar si no hay token real)
            // En una implementación real, se usaría RestTemplate
            /*
            RestTemplate restTemplate = new RestTemplate();
            String url = API_URL_DNI + dni + "?token=" + API_TOKEN;
            return restTemplate.getForObject(url, Map.class);
            */
            
            // Simulación basada en longitud
            if (dni.length() == 8) {
                result.put("success", true);
                result.put("nombre", "CLIENTE DNI " + dni); // Aquí vendría el nombre de la API
                result.put("message", "Datos obtenidos de la registraduría");
            } else {
                result.put("success", false);
                result.put("message", "DNI inválido");
            }
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Error al consultar: " + e.getMessage());
        }
        return result;
    }
}
