$(document).ready(function() {
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
                render: function(data) {
                    return `
                        <div class="d-flex gap-1 justify-content-center">
                            <button class="btn-action btn-edit btn-edit-prov" data-id="${data.id}" title="Editar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn-action btn-delete btn-delete-prov" data-id="${data.id}" title="Eliminar">
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

    // Nuevo Registro
    $('#btnNuevoProveedor').click(function() {
        $('#id').val('');
        $('#formProveedor')[0].reset();
        $('#modalTitle').html('<i class="bi bi-truck me-2"></i>Nuevo Proveedor');
        $('#proveedorModal').modal('show');
    });

    // Guardar
    $('#formProveedor').submit(function(e) {
        e.preventDefault();
        let data = {
            id: $('#id').val() || null,
            documento: $('#documento').val(),
            nombre: $('#nombre').val(),
            direccion: $('#direccion').val(),
            telefono: $('#telefono').val()
        };

        $.ajax({
            url: '/proveedores/api/guardar',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: function() {
                $('#proveedorModal').modal('hide');
                tabla.ajax.reload();
                Swal.fire('¡Éxito!', 'Proveedor guardado correctamente', 'success');
            },
            error: function(err) {
                Swal.fire('Error', 'No se pudo guardar: ' + err.responseText, 'error');
            }
        });
    });

    // Eventos de la tabla
    $('#tablaProveedores').on('click', '.btn-edit-prov', function() {
        const id = $(this).data('id');
        editarProveedor(id);
    });

    $('#tablaProveedores').on('click', '.btn-delete-prov', function() {
        const id = $(this).data('id');
        eliminarProveedor(id);
    });
});

function editarProveedor(id) {
    $.get('/proveedores/api/' + id, function(data) {
        $('#id').val(data.id);
        $('#documento').val(data.documento);
        $('#nombre').val(data.nombre);
        $('#direccion').val(data.direccion);
        $('#telefono').val(data.telefono);
        $('#modalTitle').html('<i class="bi bi-pencil-square me-2"></i>Editar Proveedor');
        $('#proveedorModal').modal('show');
    });
}

function eliminarProveedor(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "El proveedor se marcará como inactivo",
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
                success: function() {
                    $('#tablaProveedores').DataTable().ajax.reload();
                    Swal.fire('¡Eliminado!', 'El proveedor ha sido desactivado.', 'success');
                }
            });
        }
    });
}
