$(document).ready(function() {
    let dataTable;
    const categoriaModal = new bootstrap.Modal(document.getElementById('categoriaModal'));

    const REGEX_NOMBRE = /^[\p{L}\s]+$/u;
    const MSG_NOMBRE_INVALIDO = 'no se permite caracteres especiales (), @, ", +,-. ';

    function showFieldError(fieldName, message) {
        $(`#${fieldName}`).addClass('is-invalid');
        $(`#${fieldName}-error`).text(message);
    }

    function clearFieldErrors() {
        $('#formCategoria .form-control').removeClass('is-invalid');
        $('#formCategoria .invalid-feedback').text('');
    }

    function validarNombreInput() {
        const valor = $('#nombre').val();
        if (valor && !REGEX_NOMBRE.test(valor)) {
            showFieldError('nombre', MSG_NOMBRE_INVALIDO);
            return false;
        }
        $('#nombre').removeClass('is-invalid');
        $('#nombre-error').text('');
        return true;
    }

    function validateForm() {
        clearFieldErrors();
        let hasErrors = false;
        const nombre = $('#nombre').val().trim();

        if (!nombre) {
            showFieldError('nombre', 'El nombre es obligatorio');
            hasErrors = true;
        } else if (!REGEX_NOMBRE.test(nombre)) {
            showFieldError('nombre', MSG_NOMBRE_INVALIDO);
            hasErrors = true;
        }

        return !hasErrors;
    }

    $('#nombre').on('input', validarNombreInput);

    dataTable = $('#tablaCategorias').DataTable({
        ajax: { url: '/categorias/api/listar', dataSrc: 'data' },
        columns: [
            { data: 'id' },
            { data: 'nombre' },
            { data: 'descripcion' },
            { 
                data: 'estado',
                render: (data) => data === 1 ? '<span class="badge bg-success">Activo</span>' : '<span class="badge bg-danger">Inactivo</span>'
            },
            {
                data: null,
                className: 'text-center',
                render: (data, type, row) => {
                    const statusIcon = row.estado === 1 ? 'bi-slash-circle-fill' : 'bi-check-circle-fill';
                    const statusTitle = row.estado === 1 ? 'Desactivar' : 'Activar';
                    return `
                        <div class="d-flex gap-1 justify-content-center">
                            <button class="btn-action btn-edit" data-id="${row.id}" title="Editar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn-action btn-status" data-id="${row.id}" title="${statusTitle}">
                                <i class="bi ${statusIcon}"></i>
                            </button>
                            <button class="btn-action btn-delete" data-id="${row.id}" title="Eliminar">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        dom: 'rtip',
        language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
    });

    setupTableSearch('#buscadorCategorias', dataTable);

    $('#btnNuevaCategoria').click(() => {
        $('#formCategoria')[0].reset();
        $('#id').val('');
        clearFieldErrors();
        $('#modalTitle').text('Nueva Categoría');
        categoriaModal.show();
    });

    $('#formCategoria').submit(function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const data = {
            id: $('#id').val() || null,
            nombre: $('#nombre').val().trim(),
            descripcion: $('#descripcion').val()
        };

        fetch('/categorias/api/guardar', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...getCsrfHeaders()
            },
            body: JSON.stringify(data)
        }).then(res => res.json()).then(res => {
            if (res.success) {
                categoriaModal.hide();
                Swal.fire('Éxito', res.message, 'success');
                dataTable.ajax.reload();
            } else if (res.message === MSG_NOMBRE_INVALIDO || res.message === 'El nombre es obligatorio') {
                showFieldError('nombre', res.message);
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        });
    });

    $('#tablaCategorias').on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        fetch(`/categorias/api/${id}`).then(res => res.json()).then(res => {
            if (res.success) {
                clearFieldErrors();
                $('#id').val(res.data.id);
                $('#nombre').val(res.data.nombre);
                $('#descripcion').val(res.data.descripcion);
                $('#modalTitle').text('Editar Categoría');
                categoriaModal.show();
            }
        });
    });

    $('#tablaCategorias').on('click', '.btn-status', function() {
        const id = $(this).data('id');
        fetch(`/categorias/api/cambiar-estado/${id}`, {
            method: 'POST',
            headers: getCsrfHeaders()
        })
        .then(res => res.json())
        .then(res => {
            if (res.success) {
                Swal.fire('¡Éxito!', res.message, 'success');
                dataTable.ajax.reload();
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        });
    });

    $('#tablaCategorias').on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción! Se eliminará la categoría del sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/categorias/api/eliminar/${id}`, { 
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                })
                .then(res => res.json())
                .then(res => {
                    if (res.success) {
                        Swal.fire('Eliminado', res.message, 'success');
                        dataTable.ajax.reload();
                    } else {
                        Swal.fire('Error', res.message, 'error');
                    }
                });
            }
        });
    });
});
