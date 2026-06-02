$(document).ready(function() {
    let dataTable;
    const productoModal = new bootstrap.Modal(document.getElementById('productoModal'));

    dataTable = $('#tablaProductos').DataTable({
        ajax: { url: '/productos/api/listar', dataSrc: 'data' },
        columns: [
            { data: 'id' },
            { 
                data: 'imagen',
                render: (data) => data 
                    ? `<img src="${data}?t=${new Date().getTime()}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">`
                    : `<img src="/images/products/placeholder.jpg" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">`
            },
            { data: 'nombre', className: 'fw-bold text-primary' },
            { data: 'descripcion', className: 'small text-muted' },
            { data: 'categoria.nombre' },
            { 
                data: 'estado',
                render: (data) => data === 1 ? '<span class="badge-activo">Activo</span>' : '<span class="badge bg-danger text-white">Inactivo</span>'
            },
            { 
                data: 'fechaRegistro',
                render: (data) => data ? data.replace('T', ' ').substring(0, 19) : '-'
            },
            {
                data: null,
                className: 'text-center',
                render: (data, type, row) => `
                    <div class="d-flex gap-1 justify-content-center">
                        <button class="btn-action btn-edit btn-edit-row" data-id="${row.id}" title="Editar">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn-action btn-view btn-view-row" data-id="${row.id}" title="Ver detalle">
                            <i class="bi bi-box-fill"></i>
                        </button>
                        <button class="btn-action btn-delete btn-delete-row" data-id="${row.id}" title="Eliminar">
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                        <button class="btn-action btn-status btn-status-row" data-id="${row.id}" title="Cambiar estado">
                            <i class="bi bi-slash-circle-fill"></i>
                        </button>
                    </div>
                `
            }
        ],
        dom: 'rtip', // Hide default search bar to use custom one
        language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
    });

    // Custom Search
    $('#customSearch').on('keyup', function() {
        dataTable.search(this.value).draw();
    });

    $('#btnNuevoProducto').click(() => {
        $('#formProducto')[0].reset();
        $('#id').val('');
        $('#imagePreview').hide().find('img').attr('src', '');
        $('.modal-title').text('Nuevo Producto');
        productoModal.show();
    });

    // Image Preview
    $('#imagenFile').on('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#imagePreview').show().find('img').attr('src', e.target.result);
            }
            reader.readAsDataURL(file);
        } else {
            $('#imagePreview').hide();
        }
    });

    $('#formProducto').submit(function(e) {
        e.preventDefault();
        
        const productoData = {
            id: $('#id').val() || null,
            nombre: $('#nombre').val(),
            categoria: { id: $('#id_categoria').val() },
            precioCompra: $('#precioCompra').val(),
            precioVenta: $('#precioVenta').val(),
            stock: $('#stock').val(),
            stockMinimo: $('#stockMinimo').val(),
            descripcion: $('#descripcion').val(),
            estado: 1
        };

        const formData = new FormData();
        formData.append('producto', new Blob([JSON.stringify(productoData)], { type: 'application/json' }));
        
        const fileInput = document.getElementById('imagenFile');
        if (fileInput.files.length > 0) {
            formData.append('imagenFile', fileInput.files[0]);
        }

        fetch('/productos/api/guardar', {
            method: 'POST',
            headers: { 
                ...getCsrfHeaders()
            },
            body: formData
        }).then(res => res.json()).then(res => {
            if (res.success) {
                productoModal.hide();
                Swal.fire('Éxito', res.message, 'success');
                dataTable.ajax.reload();
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        });
    });

    $('#tablaProductos').on('click', '.btn-edit-row', function() {
        const id = $(this).data('id');
        fetch(`/productos/api/${id}`).then(res => res.json()).then(res => {
            if (res.success) {
                const p = res.data;
                $('#id').val(p.id);
                $('#nombre').val(p.nombre);
                $('#id_categoria').val(p.categoria ? p.categoria.id : '');
                $('#precioCompra').val(p.precioCompra);
                $('#precioVenta').val(p.precioVenta);
                $('#stock').val(p.stock);
                $('#stockMinimo').val(p.stockMinimo);
                $('#descripcion').val(p.descripcion);
                
                if (p.imagen) {
                    $('#imagePreview').show().find('img').attr('src', p.imagen);
                } else {
                    $('#imagePreview').hide();
                }

                $('.modal-title').text('Editar Producto');
                productoModal.show();
            }
        });
    });

    $('#tablaProductos').on('click', '.btn-delete-row', function() {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Eliminar producto?',
            text: "Se cambiará el estado a Inactivo",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/productos/api/eliminar/${id}`, { 
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

    // Ver Detalles
    $('#tablaProductos').on('click', '.btn-view-row', function() {
        const id = $(this).data('id');
        fetch(`/productos/api/${id}`).then(res => res.json()).then(res => {
            if (res.success) {
                const p = res.data;
                let html = `
                    <div class="text-start">
                        <p><strong>Categoría:</strong> ${p.categoria ? p.categoria.nombre : '-'}</p>
                        <p><strong>Precio Compra:</strong> S/. ${p.precioCompra}</p>
                        <p><strong>Precio Venta:</strong> S/. ${p.precioVenta}</p>
                        <p><strong>Stock Actual:</strong> ${p.stock}</p>
                        <p><strong>Stock Mínimo:</strong> ${p.stockMinimo}</p>
                        <p><strong>Descripción:</strong> ${p.descripcion || 'Sin descripción'}</p>
                    </div>
                `;
                Swal.fire({
                    title: p.nombre,
                    html: html,
                    imageUrl: p.imagen || '/images/products/placeholder.jpg',
                    imageWidth: 200,
                    imageHeight: 200,
                    imageAlt: p.nombre,
                });
            }
        });
    });

    // Cambiar Estado (Activar/Inactivar)
    $('#tablaProductos').on('click', '.btn-status-row', function() {
        const id = $(this).data('id');
        fetch(`/productos/api/${id}`).then(res => res.json()).then(res => {
            if (res.success) {
                const p = res.data;
                const nuevoEstado = p.estado === 1 ? 2 : 1; // 1: Activo, 2: Inactivo
                const pData = { ...p, estado: nuevoEstado };
                
                const formData = new FormData();
                formData.append('producto', new Blob([JSON.stringify(pData)], { type: 'application/json' }));

                fetch('/productos/api/guardar', {
                    method: 'POST',
                    headers: getCsrfHeaders(),
                    body: formData
                }).then(res => res.json()).then(res => {
                    if (res.success) {
                        Swal.fire('Estado actualizado', res.message, 'success');
                        dataTable.ajax.reload();
                    }
                });
            }
        });
    });
});
