$(document).ready(function() {
    let dataTable;
    const productoModal = new bootstrap.Modal(document.getElementById('productoModal'));
    const placeholderImg = window.PRODUCT_PLACEHOLDER || '/images/products/placeholder.svg';

    function parseJsonResponse(res) {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            throw new Error('El servidor devolvió una respuesta inesperada. ¿Sesión expirada?');
        }
        return res.json();
    }

    const MSG_NUMERO_NEGATIVO = 'El número ingresado es negativo, ingrese uno positivo';
    const CAMPOS_NUMERICOS = ['precioCompra', 'precioVenta', 'stock', 'stockMinimo'];

    function showFieldError(fieldName, message) {
        $(`#${fieldName}`).addClass('is-invalid');
        $(`#${fieldName}-error`).text(message);
    }

    function clearFieldErrors() {
        $('#formProducto .form-control').removeClass('is-invalid');
        $('#formProducto .invalid-feedback').text('');
    }

    function esNumeroNegativo(valor) {
        return valor !== '' && !isNaN(parseFloat(valor)) && parseFloat(valor) < 0;
    }

    function validarNumeroNegativo(fieldId) {
        const valor = $(`#${fieldId}`).val();
        if (esNumeroNegativo(valor)) {
            showFieldError(fieldId, MSG_NUMERO_NEGATIVO);
            return false;
        }
        $(`#${fieldId}`).removeClass('is-invalid');
        $(`#${fieldId}-error`).text('');
        return true;
    }

    function validateForm() {
        clearFieldErrors();
        let hasErrors = false;

        CAMPOS_NUMERICOS.forEach((campo) => {
            if (!validarNumeroNegativo(campo)) {
                hasErrors = true;
            }
        });

        const precioVentaVal = $('#precioVenta').val();
        if (precioVentaVal === '' || isNaN(parseFloat(precioVentaVal))) {
            showFieldError('precioVenta', 'El precio de venta es obligatorio');
            hasErrors = true;
        }

        return !hasErrors;
    }

    CAMPOS_NUMERICOS.forEach((campo) => {
        $(`#${campo}`).on('input', function() {
            validarNumeroNegativo(this.id);
        });
    });

    dataTable = $('#tablaProductos').DataTable({
        ajax: { url: '/productos/api/listar', dataSrc: 'data' },
        columns: [
            { data: 'id' },
            { 
                data: 'imagen',
                render: (data) => data 
                    ? `<img src="${data}?t=${new Date().getTime()}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">`
                    : `<img src="${placeholderImg}" class="img-thumbnail" style="width: 50px; height: 50px; object-fit: cover;">`
            },
            { data: 'nombre', className: 'fw-bold text-primary' },
            { data: 'descripcion', className: 'small text-muted', defaultContent: '—' },
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
                render: (data, type, row) => {
                    const statusIcon = row.estado === 1 ? 'bi-slash-circle-fill' : 'bi-check-circle-fill';
                    const statusTitle = row.estado === 1 ? 'Desactivar' : 'Activar';
                    return `
                        <div class="d-flex gap-1 justify-content-center">
                            <button class="btn-action btn-edit btn-edit-row" data-id="${row.id}" title="Editar">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn-action btn-view btn-view-row" data-id="${row.id}" title="Ver detalle">
                                <i class="bi bi-box-fill"></i>
                            </button>
                            <button class="btn-action btn-status btn-status-row" data-id="${row.id}" title="${statusTitle}">
                                <i class="bi ${statusIcon}"></i>
                            </button>
                            <button class="btn-action btn-delete btn-delete-row" data-id="${row.id}" title="Eliminar">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        dom: 'rtip', // Hide default search bar to use custom one
        language: window.DATATABLES_ES
    });

    // Custom Search
    setupTableSearch('#customSearch', dataTable);

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        fetch(`/productos/api/${editId}`).then(parseJsonResponse).then(res => {
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
                }
                $('.modal-title').text('Editar Producto');
                productoModal.show();
            }
        });
    }

    $('#btnNuevoProducto').click(() => {
        $('#formProducto')[0].reset();
        $('#id').val('');
        $('#imagenFile').val('');
        clearFieldErrors();
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

        if (!validateForm()) {
            return;
        }
        
        const idVal = $('#id').val();
        const productoData = {
            id: idVal ? parseInt(idVal, 10) : null,
            nombre: $('#nombre').val(),
            categoria: { id: $('#id_categoria').val() },
            precioCompra: $('#precioCompra').val() !== '' ? parseFloat($('#precioCompra').val()) : null,
            precioVenta: parseFloat($('#precioVenta').val()),
            stock: parseInt($('#stock').val(), 10) || 0,
            stockMinimo: parseInt($('#stockMinimo').val(), 10) || 0,
            descripcion: $('#descripcion').val()
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
        }).then(parseJsonResponse).then(res => {
            if (res.success) {
                productoModal.hide();
                Swal.fire('Éxito', res.message, 'success');
                dataTable.ajax.reload();
            } else {
                if (res.message === MSG_NUMERO_NEGATIVO) {
                    CAMPOS_NUMERICOS.forEach((campo) => validarNumeroNegativo(campo));
                } else {
                    Swal.fire('Error', res.message, 'error');
                }
            }
        }).catch(err => {
            Swal.fire('Error', err.message || 'No se pudo guardar el producto', 'error');
        });
    });

    $('#tablaProductos').on('click', '.btn-edit-row', function() {
        const id = $(this).data('id');
        fetch(`/productos/api/${id}`).then(parseJsonResponse).then(res => {
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

                clearFieldErrors();
                $('.modal-title').text('Editar Producto');
                productoModal.show();
            }
        });
    });

    $('#tablaProductos').on('click', '.btn-delete-row', function() {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción! Se eliminará el producto del sistema.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/productos/api/eliminar/${id}`, { 
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                })
                .then(parseJsonResponse).then(res => {
                    if (res.success) {
                        Swal.fire('Eliminado', res.message, 'success');
                        dataTable.ajax.reload();
                    }
                }).catch(err => {
                    Swal.fire('Error', err.message || 'No se pudo eliminar el producto', 'error');
                });
            }
        });
    });

    // Ver Detalles
    $('#tablaProductos').on('click', '.btn-view-row', function() {
        const id = $(this).data('id');
        fetch(`/productos/api/${id}`).then(parseJsonResponse).then(res => {
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
                    imageUrl: p.imagen || placeholderImg,
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
        fetch(`/productos/api/cambiar-estado/${id}`, {
            method: 'POST',
            headers: getCsrfHeaders()
        })
        .then(parseJsonResponse)
        .then(res => {
            if (res.success) {
                Swal.fire('¡Éxito!', res.message, 'success');
                dataTable.ajax.reload();
            } else {
                Swal.fire('Error', res.message, 'error');
            }
        })
        .catch(err => {
            Swal.fire('Error', err.message || 'No se pudo cambiar el estado', 'error');
        });
    });
});
