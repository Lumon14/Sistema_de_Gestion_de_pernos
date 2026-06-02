$(document).ready(function() {
    let dataTable;
    const categoriaModal = new bootstrap.Modal(document.getElementById('categoriaModal'));

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
                render: (data, type, row) => `
                    <div class="d-flex gap-1 justify-content-center">
                        <button class="btn-action btn-edit" data-id="${row.id}" title="Editar">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn-action btn-delete" data-id="${row.id}" title="Eliminar">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                `
            }
        ],
        language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
    });

    $('#btnNuevaCategoria').click(() => {
        $('#formCategoria')[0].reset();
        $('#id').val('');
        $('#modalTitle').text('Nueva Categoría');
        categoriaModal.show();
    });

    $('#formCategoria').submit(function(e) {
        e.preventDefault();
        const data = {
            id: $('#id').val() || null,
            nombre: $('#nombre').val(),
            descripcion: $('#descripcion').val(),
            estado: 1
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
            }
        });
    });

    $('#tablaCategorias').on('click', '.btn-edit', function() {
        const id = $(this).data('id');
        fetch(`/categorias/api/${id}`).then(res => res.json()).then(res => {
            if (res.success) {
                $('#id').val(res.data.id);
                $('#nombre').val(res.data.nombre);
                $('#descripcion').val(res.data.descripcion);
                $('#modalTitle').text('Editar Categoría');
                categoriaModal.show();
            }
        });
    });

    $('#tablaCategorias').on('click', '.btn-delete', function() {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Eliminar?',
            text: "Esta acción desactivará la categoría",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, desactivar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/categorias/api/eliminar/${id}`, { 
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                })
                    .then(res => res.json()).then(res => {
                        if (res.success) {
                            Swal.fire('Eliminado', res.message, 'success');
                            dataTable.ajax.reload();
                        }
                    });
            }
        });
    });
});
