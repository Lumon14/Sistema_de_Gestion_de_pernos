/**
 * Script para la gestión de clientes
 * Archivo: src/main/resources/static/js/clientes.js
 */

$(document).ready(function() {
    let dataTable;
    let clienteModal;
    let tipoDocumento = 'dni';

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
                    orderable: false,
                    searchable: false,
                    className: 'text-center',
                    render: (data, type, row) => {
                        const statusIcon = row.estado === 1 ? 'bi-slash-circle-fill' : 'bi-check-circle-fill';
                        const statusTitle = row.estado === 1 ? 'Desactivar' : 'Activar';
                        return `
                            <div class="d-flex gap-1 justify-content-center">
                                <button class="btn-action btn-edit action-edit" data-id="${row.id}" title="Editar">
                                    <i class="bi bi-pencil-fill"></i>
                                </button>
                                <button class="btn-action btn-status action-status" data-id="${row.id}" title="${statusTitle}">
                                    <i class="bi ${statusIcon}"></i>
                                </button>
                                <button class="btn-action btn-delete action-delete" data-id="${row.id}" title="Eliminar">
                                    <i class="bi bi-trash3-fill"></i>
                                </button>
                            </div>
                        `;
                    }
                }
            ],
            dom: 'rtip',
            language: window.DATATABLES_ES || { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
        });

        setupTableSearch('#buscadorClientes', dataTable);
    }

    function getMaxLengthDocumento() {
        return tipoDocumento === 'dni' ? 8 : 11;
    }

    function setTipoDocumento(tipo) {
        tipoDocumento = tipo;
        const maxLen = getMaxLengthDocumento();
        $('#labelDocumento').text(tipo === 'dni' ? 'DNI' : 'RUC');
        $('#dniRuc').attr('maxlength', maxLen);
        $('#dniRuc').val(filtrarSoloDigitos($('#dniRuc').val(), maxLen));
        clearFieldError('dniRuc');
    }

    function detectarTipoDocumento(valor) {
        if (valor && valor.length === 11) {
            setTipoDocumento('ruc');
            $('#tipoRuc').prop('checked', true);
        } else {
            setTipoDocumento('dni');
            $('#tipoDni').prop('checked', true);
        }
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
        if (!REGEX_SOLO_DIGITOS.test(valor)) {
            return false;
        }
        return tipoDocumento === 'dni' ? valor.length === 8 : valor.length === 11;
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
            if (mostrarError) showFieldError('dniRuc', `El ${tipoDocumento === 'dni' ? 'DNI' : 'RUC'} es obligatorio`);
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
        $('input[name="tipoDocumento"]').on('change', function() {
            setTipoDocumento(this.value);
        });

        $('#dniRuc').on('input', function() {
            this.value = filtrarSoloDigitos(this.value, getMaxLengthDocumento());
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

        $('#tablaClientes tbody').on('click', '.action-status', function() {
            cambiarEstadoCliente($(this).data('id'));
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
                showLoading(false);
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
            .catch(() => {
                showLoading(false);
                Swal.fire('Error', 'Error al conectar con el servicio de consulta', 'error');
            });
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
            showLoading(false);
            if (data.success) {
                clienteModal.hide();
                Swal.fire('¡Éxito!', data.message, 'success');
                dataTable.ajax.reload();
            } else {
                mostrarErrorServidor(data.message);
            }
        })
        .catch(() => {
            showLoading(false);
            Swal.fire('Error', 'Error de conexión', 'error');
        });
    }

    function mostrarErrorServidor(message) {
        if (!message) {
            Swal.fire('Error', 'No se pudo guardar el cliente', 'error');
            return;
        }
        if (message.includes('ya se encuentra registrado') || message.includes('ya existe') || message.includes('duplicado')) {
            showFieldError('dniRuc', message);
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
                    detectarTipoDocumento(c.dniRuc || '');
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

    function cambiarEstadoCliente(id) {
        showLoading(true);
        fetch(`/clientes/api/cambiar-estado/${id}`, {
            method: 'POST',
            headers: getCsrfHeaders()
        })
        .then(res => res.json())
        .then(data => {
            showLoading(false);
            if (data.success) {
                Swal.fire('¡Éxito!', data.message, 'success');
                dataTable.ajax.reload();
            } else {
                Swal.fire('Error', data.message || 'No se pudo cambiar el estado', 'error');
            }
        })
        .catch(() => {
            showLoading(false);
            Swal.fire('Error', 'Error de conexión', 'error');
        });
    }

    function eliminarCliente(id) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción! Se eliminará el cliente del sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);
                fetch(`/clientes/api/eliminar/${id}`, {
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                })
                .then(res => res.json())
                .then(data => {
                    showLoading(false);
                    if (data.success) {
                        Swal.fire('¡Eliminado!', data.message || 'El cliente ha sido eliminado.', 'success');
                        dataTable.ajax.reload();
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo eliminar el cliente', 'error');
                    }
                })
                .catch(() => {
                    showLoading(false);
                    Swal.fire('Error', 'Error de conexión', 'error');
                });
            }
        });
    }

    function resetForm() {
        $('#formCliente')[0].reset();
        $('#id').val('');
        $('#tipoDni').prop('checked', true);
        setTipoDocumento('dni');
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
