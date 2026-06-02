package com.example.acceso.config;

import org.springframework.lang.NonNull;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final SessionInterceptor sessionInterceptor;

    public WebConfig(SessionInterceptor sessionInterceptor) {
        this.sessionInterceptor = sessionInterceptor;
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/css/**")
                .addResourceLocations("classpath:/static/css/")
                .setCachePeriod(0);

        registry.addResourceHandler("/js/**")
                .addResourceLocations("classpath:/static/js/")
                .setCachePeriod(0);

        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/")
                .setCachePeriod(0);

        registry.addResourceHandler("/images/products/**")
                .addResourceLocations("file:uploads/products/", "classpath:/static/images/products/")
                .setCachePeriod(0);
    }

    /* Comentado porque ahora usamos Spring Security para proteger las rutas
    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        registry.addInterceptor(sessionInterceptor)
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/",
                        "/login",
                        "/logout",
                        "/principal",
                        "/catalogo",
                        "/css/**",
                        "/js/**",
                        "/images/**",
                        "/error",
                        "/favicon.ico"
                );
    }
    */

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/usuarios/api/**")
                .allowedOrigins("http://localhost:8080")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}