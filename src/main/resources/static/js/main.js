/**
 * Script principal con lógica común para toda la aplicación.
 * Archivo: src/main/resources/static/js/main.js
 */

window.DATATABLES_ES = {
    processing: "Procesando...",
    lengthMenu: "Mostrar _MENU_ registros",
    zeroRecords: "No se encontraron resultados",
    emptyTable: "Ningún dato disponible en esta tabla",
    info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
    infoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
    infoFiltered: "(filtrado de un total de _MAX_ registros)",
    search: "Buscar:",
    loadingRecords: "Cargando...",
    paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
    },
    aria: {
        sortAscending: ": Activar para ordenar la columna de manera ascendente",
        sortDescending: ": Activar para ordenar la columna de manera descendente"
    }
};

window.PRODUCT_PLACEHOLDER = "/images/products/placeholder.svg";

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

    /**
     * Conecta un input de búsqueda personalizado con una DataTable.
     */
    window.setupTableSearch = function(inputSelector, dataTable) {
        const $input = $(inputSelector);
        if (!$input.length || !dataTable) {
            return;
        }
        $input.on('keyup input', function() {
            dataTable.search(this.value).draw();
        });
    };

    if ($('#btnNotificaciones').length && !window.__notifScriptLoaded) {
        window.__notifScriptLoaded = true;
        const script = document.createElement('script');
        script.src = '/js/notifications.js';
        script.onload = function () {
            if (window.initNotificaciones) window.initNotificaciones();
        };
        document.body.appendChild(script);
    }
});