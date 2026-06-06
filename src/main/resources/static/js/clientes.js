/**
 * Script para la gestión de clientes
 * Archivo: src/main/resources/static/js/clientes.js
 */

$(document).ready(function() {
    let dataTable;
    let clienteModal;

    const MSG_DNI_RUC_INVALIDO = 'ingrese un dni o ruc valido';
    const MSG_TELEFONO_INVALIDO = 'ingrese un teléfono valido';
    const MSG_CORREO_INVALIDO = 'Ingrese un correo válido con @ y .com';
    const REGEX_SOLO_DIGITOS = /^\d+$/;
    const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.com$/i;

    initializeDataTable();
    clienteModal = new bootstrap.Modal(document.getElementById('clienteModal'));
    setupEventListeners();
    setupValidacionesInput();

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

    function showFieldError(fieldName, message) {
        $(`#${fieldName}`).addClass('is-invalid');
        $(`#${fieldName}-error`).text(message);
    }

    function clearFieldError(fieldName) {
        $(`#${fieldName}`).removeClass('is-invalid');
        $(`#${fieldName}-error`).text('');
    }

    function clearFieldErrors() {
        $('#formCliente .form-control').removeClass('is-invalid');
        $('#formCliente .invalid-feedback').text('');
    }

    function filtrarSoloDigitos(valor, maxLength) {
        return valor.replace(/\D/g, '').slice(0, maxLength);
    }

    function esDniRucValido(valor) {
        return REGEX_SOLO_DIGITOS.test(valor) && (valor.length === 8 || valor.length === 11);
    }

    function esTelefonoValido(valor) {
        return REGEX_SOLO_DIGITOS.test(valor) && valor.length === 9;
    }

    function esCorreoValido(valor) {
        return REGEX_CORREO.test(valor);
    }

    function validarDniRuc(mostrarError = true) {
        const valor = $('#dniRuc').val().trim();
        if (!valor) {
            if (mostrarError) showFieldError('dniRuc', 'El DNI o RUC es obligatorio');
            return false;
        }
        if (!esDniRucValido(valor)) {
            if (mostrarError) showFieldError('dniRuc', MSG_DNI_RUC_INVALIDO);
            return false;
        }
        clearFieldError('dniRuc');
        return true;
    }

    function validarTelefono(mostrarError = true) {
        const valor = $('#telefono').val().trim();
        if (!valor) {
            if (mostrarError) showFieldError('telefono', 'El teléfono es obligatorio');
            return false;
        }
        if (!esTelefonoValido(valor)) {
            if (mostrarError) showFieldError('telefono', MSG_TELEFONO_INVALIDO);
            return false;
        }
        clearFieldError('telefono');
        return true;
    }

    function validarCorreo(mostrarError = true) {
        const valor = $('#email').val().trim();
        if (!valor) {
            if (mostrarError) showFieldError('email', 'El correo es obligatorio');
            return false;
        }
        if (!esCorreoValido(valor)) {
            if (mostrarError) showFieldError('email', MSG_CORREO_INVALIDO);
            return false;
        }
        clearFieldError('email');
        return true;
    }

    function validarNombre(mostrarError = true) {
        const valor = $('#nombre').val().trim();
        if (!valor) {
            if (mostrarError) showFieldError('nombre', 'El nombre completo es obligatorio');
            return false;
        }
        clearFieldError('nombre');
        return true;
    }

    function validateForm() {
        clearFieldErrors();
        let valido = true;

        if (!validarDniRuc()) valido = false;
        if (!validarNombre()) valido = false;
        if (!validarTelefono()) valido = false;
        if (!validarCorreo()) valido = false;

        return valido;
    }

    function setupValidacionesInput() {
        $('#dniRuc').on('input', function() {
            this.value = filtrarSoloDigitos(this.value, 11);
            const valor = this.value.trim();
            if (!valor || esDniRucValido(valor)) {
                clearFieldError('dniRuc');
            }
        });

        $('#telefono').on('input', function() {
            this.value = filtrarSoloDigitos(this.value, 9);
            const valor = this.value.trim();
            if (!valor || esTelefonoValido(valor)) {
                clearFieldError('telefono');
            }
        });

        $('#email').on('input', function() {
            const valor = this.value.trim();
            if (!valor || esCorreoValido(valor)) {
                clearFieldError('email');
            } else {
                showFieldError('email', MSG_CORREO_INVALIDO);
            }
        });

        $('#nombre').on('input', function() {
            if (this.value.trim()) {
                clearFieldError('nombre');
            }
        });
    }

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
            editarCliente($(this).data('id'));
        });

        $('#tablaClientes tbody').on('click', '.action-delete', function() {
            eliminarCliente($(this).data('id'));
        });

        $('#btnBuscarDni').on('click', consultarDocumento);
    }

    function consultarDocumento() {
        if (!validarDniRuc()) {
            return;
        }

        const documento = $('#dniRuc').val().trim();
        showLoading(true);

        fetch(`/clientes/api/consultar-externo/${documento}`)
            .then(res => res.json())
            .then(data => {
                $('#telefono').val('');
                $('#email').val('');
                $('#direccion').val('');

                if (data.success) {
                    $('#nombre').val(data.nombre || '');
                    const msg = data.origen === 'registro_local'
                        ? 'Cliente ya registrado en el sistema'
                        : (data.message || 'Datos encontrados');
                    Swal.fire('¡Éxito!', msg, 'success');
                } else {
                    $('#nombre').val('');
                    Swal.fire('Información', data.message || 'No se encontraron resultados', 'info');
                }
            })
            .catch(() => Swal.fire('Error', 'Error al conectar con el servicio de consulta', 'error'))
            .finally(() => showLoading(false));
    }

    function guardarCliente() {
        if (!validateForm()) {
            return;
        }

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
                mostrarErrorServidor(data.message);
            }
        })
        .catch(() => Swal.fire('Error', 'Error de conexión', 'error'))
        .finally(() => showLoading(false));
    }

    function mostrarErrorServidor(message) {
        if (!message) {
            Swal.fire('Error', 'No se pudo guardar el cliente', 'error');
            return;
        }
        if (message.includes('dni') || message.includes('DNI') || message.includes('RUC')) {
            showFieldError('dniRuc', MSG_DNI_RUC_INVALIDO);
            return;
        }
        if (message.includes('teléfono') || message.includes('telefono')) {
            showFieldError('telefono', MSG_TELEFONO_INVALIDO);
            return;
        }
        if (message.includes('correo')) {
            showFieldError('email', MSG_CORREO_INVALIDO);
            return;
        }
        if (message.includes('nombre')) {
            showFieldError('nombre', message);
            return;
        }
        Swal.fire('Error', message, 'error');
    }

    function editarCliente(id) {
        showLoading(true);
        fetch(`/clientes/api/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    clearFieldErrors();
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
        clearFieldErrors();
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
