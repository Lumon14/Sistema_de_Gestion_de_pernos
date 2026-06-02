/**
 * Script principal con lógica común para toda la aplicación.
 * Archivo: src/main/resources/static/js/main.js
 */

$(document).ready(function() {
    /**
     * Configura la interactividad del sidebar responsivo.
     */
    function setupSidebar() {
        const sidebar = $('#sidebar');
        const openSidebarBtn = $('#open-sidebar');
        const closeSidebarBtn = $('#close-sidebar');
        const sidebarOverlay = $('#sidebar-overlay');

        openSidebarBtn.on('click', function() {
            sidebar.addClass('active');
            sidebarOverlay.addClass('active');
        });

        function closeSidebar() {
            sidebar.removeClass('active');
            sidebarOverlay.removeClass('active');
        }

        closeSidebarBtn.on('click', closeSidebar);
        sidebarOverlay.on('click', closeSidebar);
    }

    // Inicializar la funcionalidad del sidebar en cada carga de página.
    setupSidebar();

    /**
     * Configuración global de CSRF para AJAX con jQuery (si se usa).
     */
    const csrfToken = $("meta[name='_csrf']").attr("content");
    const csrfHeader = $("meta[name='_csrf_header']").attr("content");

    if (csrfToken && csrfHeader) {
        $.ajaxSetup({
            headers: {
                [csrfHeader]: csrfToken
            }
        });
    }

    /**
     * Helper global para obtener los headers de CSRF para fetch().
     */
    window.getCsrfHeaders = function() {
        const token = $("meta[name='_csrf']").attr("content");
        const header = $("meta[name='_csrf_header']").attr("content");
        const headers = {};
        if (token && header) {
            headers[header] = token;
        }
        return headers;
    };
});