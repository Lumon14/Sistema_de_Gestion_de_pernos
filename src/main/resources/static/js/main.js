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

    // Restricción global para evitar símbolos negativos, positivos y notación científica en campos numéricos
    $(document).on('keydown', 'input[type="number"]', function(e) {
        // Bloquear explícitamente el signo menos, el signo más, la 'e' y la 'E'
        if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
            return;
        }

        // Si se presiona punto o coma, permitir solo uno en el input
        if (e.key === '.' || e.key === ',') {
            if (e.key === ',') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const val = $(this).val();
                $(this).val(val.slice(0, start) + '.' + val.slice(end));
                this.setSelectionRange(start + 1, start + 1);
            }
            if ($(this).val().includes('.')) {
                e.preventDefault();
            }
        }
    });

    $(document).on('input paste', 'input[type="number"]', function() {
        let $input = $(this);
        setTimeout(() => {
            let rawVal = $input.val();
            if (rawVal) {
                // Eliminar cualquier signo negativo/positivo o letra e/E que haya sido copiado y pegado
                let cleanVal = rawVal.toString().replace(/[-+eE]/g, '');
                if (cleanVal !== rawVal) {
                    $input.val(cleanVal);
                }
            }
        }, 0);
    });
});