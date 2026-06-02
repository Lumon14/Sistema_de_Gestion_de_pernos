package com.example.acceso.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.HandlerInterceptor;

// @Component: Marca esta clase como un componente de Spring. Esto permite que Spring
// la detecte automáticamente y la gestione, por ejemplo, para poder inyectarla en WebConfig.
@Component
public class SessionInterceptor implements HandlerInterceptor {

    // preHandle: Este método se ejecuta ANTES de que el controlador maneje una
    // petición.
    // Es el lugar perfecto para realizar validaciones, como comprobar si el usuario
    // ha iniciado sesión.
    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
            @NonNull Object handler)
            throws Exception {
        // request.getSession(false): Obtiene la sesión actual si existe. El 'false' es
        // importante
        // porque evita que se cree una nueva sesión si el usuario no tiene una.
        HttpSession session = request.getSession(false); // No crea una nueva sesión si no existe

        // Comprueba si no hay sesión o si el atributo "usuarioLogueado" no existe en la
        // sesión.
        if (session == null || session.getAttribute("usuarioLogueado") == null) {
            // Si el usuario no ha iniciado sesión, lo redirige a la página de login.
            response.sendRedirect("/login");
            // Devuelve 'false' para detener el procesamiento de la petición. El controlador
            // correspondiente a la URL solicitada no se ejecutará.
            return false; // Detiene la ejecución de la petición
        }
        // Si la sesión y el atributo existen, devuelve 'true' para permitir que la
        // petición continúe
        // hacia el controlador.
        return true; // Continúa con la ejecución
    }
}