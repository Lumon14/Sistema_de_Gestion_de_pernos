/**
 * Script para la gestión de clientes
 * Archivo: src/main/resources/static/js/clientes.js
 */

$(document).ready(function() {
    // Variables globales
    let dataTable;
    let clienteModal;

    // Inicializar Componentes
    initializeDataTable();
    clienteModal = new bootstrap.Modal(document.getElementById('clienteModal'));

    // Event Listeners
    setupEventListeners();

    /**
     * Inicializa DataTable para listar clientes
     */
    function initializeDataTable() {
        dataTable = $('#tablaClientes').DataTable({
            responsive: true,
            ajax: {
                url: '/clientes/api/listar',
                dataSrc: 'data'
            },
            columns: [
                { data: 'id' },
                { data: 'dniRuc' },
                { data: 'nombre' },
                { data: 'telefono', render: (data) => data || '-' },
                { data: 'email', render: (data) => data || '-' },
                { 
                    data: 'estado',
                    render: (data) => data === 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'
                },
                {
                    data: null,
                    className: 'text-center',
                    render: (data, type, row) => `
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-sm btn-outline-primary action-edit" data-id="${row.id}" title="Editar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            ${row.estado === 1 ? `
                                <button class="btn btn-sm btn-outline-danger action-delete" data-id="${row.id}" title="Desactivar">
                                    <i class="bi bi-trash-fill"></i>
                                </button>
                            ` : ''}
                        </div>
                    `
                }
            ],
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
        });
    }

    /**
     * Event Listeners
     */
    function setupEventListeners() {
        $('#btnNuevoCliente').on('click', () => {
            resetForm();
            $('#modalTitle').text('Nuevo Cliente');
            clienteModal.show();
        });

        $('#formCliente').on('submit', function(e) {
            e.preventDefault();
            guardarCliente();
        });

        $('#tablaClientes tbody').on('click', '.action-edit', function() {
            const id = $(this).data('id');
            editarCliente(id);
        });

        $('#tablaClientes tbody').on('click', '.action-delete', function() {
            const id = $(this).data('id');
            eliminarCliente(id);
        });

        $('#btnBuscarDni').on('click', function() {
            const dni = $('#dniRuc').val().trim();
            if (dni.length < 8) {
                Swal.fire('Atención', 'Ingrese un DNI o RUC válido', 'warning');
                return;
            }

            showLoading(true);
            fetch(`/clientes/api/consultar-externo/${dni}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        $('#nombre').val(data.nombre);
                        Swal.fire('¡Éxito!', 'Datos encontrados', 'success');
                    } else {
                        Swal.fire('Información', data.message || 'No se encontraron resultados', 'info');
                    }
                })
                .catch(() => Swal.fire('Error', 'Error al conectar con el servicio de consulta', 'error'))
                .finally(() => showLoading(false));
        });
    }

    /**
     * Guarda o actualiza un cliente
     */
    function guardarCliente() {
        const clienteData = {
            id: $('#id').val() || null,
            dniRuc: $('#dniRuc').val().trim(),
            nombre: $('#nombre').val().trim(),
            telefono: $('#telefono').val().trim(),
            email: $('#email').val().trim(),
            direccion: $('#direccion').val().trim()
        };

        showLoading(true);
        fetch('/clientes/api/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getCsrfHeaders()
            },
            body: JSON.stringify(clienteData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                clienteModal.hide();
                Swal.fire('¡Éxito!', data.message, 'success');
                dataTable.ajax.reload();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(() => Swal.fire('Error', 'Error de conexión', 'error'))
        .finally(() => showLoading(false));
    }

    /**
     * Carga datos para editar
     */
    function editarCliente(id) {
        showLoading(true);
        fetch(`/clientes/api/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const c = data.data;
                    $('#id').val(c.id);
                    $('#dniRuc').val(c.dniRuc);
                    $('#nombre').val(c.nombre);
                    $('#telefono').val(c.telefono);
                    $('#email').val(c.email);
                    $('#direccion').val(c.direccion);
                    
                    $('#modalTitle').text('Editar Cliente');
                    clienteModal.show();
                }
            })
            .finally(() => showLoading(false));
    }

    /**
     * Borrado lógico de cliente
     */
    function eliminarCliente(id) {
        Swal.fire({
            title: '¿Desactivar cliente?',
            text: "El cliente ya no aparecerá en la búsqueda de ventas.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, desactivar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/clientes/api/eliminar/${id}`, { 
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Desactivado', data.message, 'success');
                        dataTable.ajax.reload();
                    }
                });
            }
        });
    }

    function resetForm() {
        $('#formCliente')[0].reset();
        $('#id').val('');
        $('.is-invalid').removeClass('is-invalid');
    }

    function showLoading(show) {
        if (show) {
            Swal.fire({
                title: 'Cargando...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
        } else {
            Swal.close();
        }
    }
});
