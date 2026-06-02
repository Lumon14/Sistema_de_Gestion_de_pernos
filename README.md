# Gestión de Pernos

**Autor:** *Luz De Belén Montenegro Samamé*

## Descripción
Este proyecto es una solución integral para la gestión de pernos en el contexto de la asignatura *Integrador I* de la Universidad Tecnológica del Perú - UTP. Proporciona funcionalidades para:

- Registro y seguimiento de pedidos de pernos.
- Generación de reportes de ventas y mejoras.
- Interfaz web basada en Java (Spring) y Maven.
- Base de datos SQL para almacenar información de pedidos y mejoras.

## Tecnologías usadas
- **Java 17** (compatibilidad con Maven)
- **Spring Boot** (para la capa de servicios y APIs REST)
- **Maven** (gestión de dependencias y compilación)
- **SQL** (scripts `db_mejoras_venta.sql` y `db_pedidos.sql`)
- **HTML/CSS/JavaScript** (interfaz de usuario en `src/main/resources`)

## Estructura del proyecto
```
.
├── HELP.md                 # Documentación de ayuda del proyecto
├── pom.xml                 # Archivo de configuración de Maven
├── src/                    # Código fuente del proyecto
│   ├── main/               # Código de la aplicación
│   └── test/               # Tests unitarios
├── db_mejoras_venta.sql   # Script de la base de datos para mejoras de venta
├── db_pedidos.sql         # Script de la base de datos para pedidos
└── README.md               # Este archivo
```

## Instalación y ejecución
1. **Clonar el repositorio** (si es necesario).
2. **Compilar el proyecto**:
   ```bash
   ./mvnw clean install
   ```
3. **Ejecutar la aplicación**:
   ```bash
   ./mvnw spring-boot:run
   ```
   La aplicación estará disponible en `http://localhost:8080`.

## Contribuir
- Abre un *issue* para reportar bugs o proponer mejoras.
- Realiza *pull requests* siguiendo las convenciones de código del proyecto.
- Asegúrate de que los tests pasen antes de enviar tu PR.

## Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

---
*¡Gracias por usar este proyecto!*
