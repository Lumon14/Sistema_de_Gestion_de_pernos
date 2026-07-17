$(document).ready(function() {
    let tipoDocumento = 'dni';

    const MSG_DNI_RUC_INVALIDO = 'ingrese un dni o ruc valido';
    const MSG_TELEFONO_INVALIDO = 'ingrese un teléfono valido';
    const REGEX_SOLO_DIGITOS = /^\d+$/;

    let tabla = $('#tablaProveedores').DataTable({
        ajax: {
            url: '/proveedores/api/todos',
            dataSrc: ''
        },
        columns: [
            { data: 'id' },
            { data: 'documento' },
            { data: 'nombre' },
            { data: 'direccion' },
            { data: 'telefono' },
            {
                data: 'estado',
                render: function(data) {
                    return data === 1 ? '<span class="badge-activo">Activo</span>' : '<span class="badge-inactivo">Inactivo</span>';
                }
            },
            {
                data: null,
                render: function(row) {
                    const statusIcon = row.estado === 1 ? 'bi-slash-circle-fill' : 'bi-check-circle-fill';
                    const statusTitle = row.estado === 1 ? 'Desactivar' : 'Activar';
                    return `
                        <div class="d-flex gap-1 justify-content-center">
                            <button class="btn-action btn-edit btn-edit-prov" data-id="${row.id}" title="Editar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn-action btn-status btn-status-prov" data-id="${row.id}" title="${statusTitle}">
                                <i class="bi ${statusIcon}"></i>
                            </button>
                            <button class="btn-action btn-delete btn-delete-prov" data-id="${row.id}" title="Eliminar">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        dom: 'rt<"d-flex justify-content-between p-3 border-top"ip>'
    });

    setupTableSearch('#buscadorProveedores', tabla);
    setupValidacionesInput();

    function getMaxLengthDocumento() {
        return tipoDocumento === 'dni' ? 8 : 11;
    }

    function filtrarSoloDigitos(valor, maxLength) {
        return valor.replace(/\D/g, '').slice(0, maxLength);
    }

    function setTipoDocumento(tipo) {
        tipoDocumento = tipo;
        const maxLen = getMaxLengthDocumento();
        $('#labelDocumento').text(tipo === 'dni' ? 'DNI' : 'RUC');
        $('#labelNombre').text(tipo === 'dni' ? 'Nombre completo' : 'Nombre de empresa');
        $('#nombre').attr('placeholder', tipo === 'dni' ? 'Nombre completo del proveedor' : 'Nombre de la empresa');
        $('#documento').attr('maxlength', maxLen);
        $('#documento').val(filtrarSoloDigitos($('#documento').val(), maxLen));
        clearFieldError('documento');
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
        $('#formProveedor .form-control').removeClass('is-invalid');
        $('#formProveedor .invalid-feedback').text('');
    }

    function esDocumentoValido(valor) {
        if (!REGEX_SOLO_DIGITOS.test(valor)) return false;
        return tipoDocumento === 'dni' ? valor.length === 8 : valor.length === 11;
    }

    function esTelefonoValido(valor) {
        if (!valor) return true;
        return REGEX_SOLO_DIGITOS.test(valor) && valor.length === 9;
    }

    function validarDocumento(mostrarError = true) {
        const valor = $('#documento').val().trim();
        if (!valor) {
            if (mostrarError) showFieldError('documento', `El ${tipoDocumento === 'dni' ? 'DNI' : 'RUC'} es obligatorio`);
            return false;
        }
        if (!esDocumentoValido(valor)) {
            if (mostrarError) showFieldError('documento', MSG_DNI_RUC_INVALIDO);
            return false;
        }
        clearFieldError('documento');
        return true;
    }

    function validarNombre(mostrarError = true) {
        const valor = $('#nombre').val().trim();
        if (!valor) {
            const msg = tipoDocumento === 'dni' ? 'El nombre completo es obligatorio' : 'El nombre de empresa es obligatorio';
            if (mostrarError) showFieldError('nombre', msg);
            return false;
        }
        clearFieldError('nombre');
        return true;
    }

    function validarTelefono(mostrarError = true) {
        const valor = $('#telefono').val().trim();
        if (!esTelefonoValido(valor)) {
            if (mostrarError) showFieldError('telefono', MSG_TELEFONO_INVALIDO);
            return false;
        }
        clearFieldError('telefono');
        return true;
    }

    function validateForm() {
        clearFieldErrors();
        let valido = true;
        if (!validarDocumento()) valido = false;
        if (!validarNombre()) valido = false;
        if (!validarTelefono()) valido = false;
        return valido;
    }

    function setupValidacionesInput() {
        $('input[name="tipoDocumento"]').on('change', function() {
            setTipoDocumento(this.value);
        });

        $('#documento').on('input', function() {
            this.value = filtrarSoloDigitos(this.value, getMaxLengthDocumento());
            const valor = this.value.trim();
            if (!valor || esDocumentoValido(valor)) {
                clearFieldError('documento');
            }
        });

        $('#telefono').on('input', function() {
            this.value = filtrarSoloDigitos(this.value, 9);
            const valor = this.value.trim();
            if (!valor || esTelefonoValido(valor)) {
                clearFieldError('telefono');
            }
        });

        $('#nombre').on('input', function() {
            if (this.value.trim()) clearFieldError('nombre');
        });
    }

    function resetForm() {
        $('#formProveedor')[0].reset();
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

    $('#btnNuevoProveedor').click(function() {
        resetForm();
        $('#modalTitle').html('<i class="bi bi-truck me-2"></i>Nuevo Proveedor');
        $('#proveedorModal').modal('show');
    });

    $('#btnConsultarDocumento').on('click', function() {
        if (!validarDocumento()) return;

        const documento = $('#documento').val().trim();
        showLoading(true);

        fetch(`/clientes/api/consultar-externo/${documento}`)
            .then(res => res.json())
            .then(data => {
                showLoading(false);
                if (data.success) {
                    $('#nombre').val(data.nombre || '');
                    if (data.direccion) {
                        $('#direccion').val(data.direccion);
                    }
                    const msg = data.origen === 'registro_local'
                        ? 'Documento encontrado en el sistema'
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
    });

    $('#formProveedor').submit(function(e) {
        e.preventDefault();
        if (!validateForm()) return;

        const data = {
            id: $('#id').val() || null,
            documento: $('#documento').val().trim(),
            nombre: $('#nombre').val().trim(),
            direccion: $('#direccion').val().trim(),
            telefono: $('#telefono').val().trim()
        };

        $.ajax({
            url: '/proveedores/api/guardar',
            type: 'POST',
            contentType: 'application/json',
            headers: getCsrfHeaders(),
            data: JSON.stringify(data),
            success: function(res) {
                $('#proveedorModal').modal('hide');
                tabla.ajax.reload();
                Swal.fire('¡Éxito!', res.message || 'Proveedor guardado correctamente', 'success');
            },
            error: function(xhr) {
                const msg = xhr.responseText || 'No se pudo guardar el proveedor';
                if (msg.includes('ya se encuentra registrado') || msg.includes('ya existe') || msg.includes('duplicado')) {
                    showFieldError('documento', msg);
                } else if (msg.includes('dni') || msg.includes('DNI') || msg.includes('RUC') || msg.includes('documento')) {
                    showFieldError('documento', MSG_DNI_RUC_INVALIDO);
                } else if (msg.includes('teléfono') || msg.includes('telefono')) {
                    showFieldError('telefono', MSG_TELEFONO_INVALIDO);
                } else if (msg.includes('nombre')) {
                    showFieldError('nombre', msg);
                } else {
                    Swal.fire('Error', msg, 'error');
                }
            }
        });
    });

    $('#tablaProveedores').on('click', '.btn-edit-prov', function() {
        editarProveedor($(this).data('id'));
    });

    $('#tablaProveedores').on('click', '.btn-status-prov', function() {
        const id = $(this).data('id');
        $.ajax({
            url: '/proveedores/api/cambiar-estado/' + id,
            type: 'POST',
            headers: getCsrfHeaders(),
            success: function(res) {
                tabla.ajax.reload();
                Swal.fire('¡Éxito!', res.message || 'Estado actualizado', 'success');
            },
            error: function(xhr) {
                const msg = xhr.responseText || 'No se pudo cambiar el estado';
                Swal.fire('Error', msg, 'error');
            }
        });
    });

    $('#tablaProveedores').on('click', '.btn-delete-prov', function() {
        eliminarProveedor($(this).data('id'));
    });

    function editarProveedor(id) {
        $.get('/proveedores/api/' + id, function(data) {
            clearFieldErrors();
            $('#id').val(data.id);
            detectarTipoDocumento(data.documento || '');
            $('#documento').val(data.documento || '');
            $('#nombre').val(data.nombre || '');
            $('#direccion').val(data.direccion || '');
            $('#telefono').val(data.telefono || '');
            $('#modalTitle').html('<i class="bi bi-pencil-square me-2"></i>Editar Proveedor');
            $('#proveedorModal').modal('show');
        });
    }

    function eliminarProveedor(id) {
        Swal.fire({
            title: '¿Estás seguro?',
            text: '¡No podrás revertir esta acción! Se eliminará el proveedor del sistema.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: '/proveedores/api/eliminar/' + id,
                    type: 'DELETE',
                    headers: getCsrfHeaders(),
                    success: function(res) {
                        tabla.ajax.reload();
                        Swal.fire('¡Eliminado!', res.message || 'El proveedor ha sido eliminado.', 'success');
                    },
                    error: function(xhr) {
                        const msg = xhr.responseText || 'No se pudo eliminar el proveedor';
                        Swal.fire('Error', msg, 'error');
                    }
                });
            }
        });
    }
});
