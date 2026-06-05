$(document).ready(function () {
    const tablaInventario = $('#tablaInventario').DataTable({
        responsive: true,
        ajax: {
            url: '/inventario/api/listar',
            dataSrc: 'data'
        },
        columns: [
            {
                data: 'imagen',
                defaultContent: '/images/products/placeholder.jpg',
                render: function (data) {
                    const src = data || '/images/products/placeholder.jpg';
                    return `<img src="${src}" width="38" height="38" class="rounded shadow-sm">`;
                }
            },
            { data: 'nombre', className: 'fw-bold text-dark' },
            {
                data: 'stock',
                className: 'text-center fw-bold',
                render: data => `${data || 0} uds.`
            },
            {
                data: 'stockMinimo',
                className: 'text-center text-muted',
                render: data => `${data || 0} uds.`
            },
            {
                data: null,
                className: 'text-center',
                render: function (row) {
                    const stock = row.stock || 0;
                    const min = row.stockMinimo || 0;
                    if (stock <= 0) {
                        return '<span class="badge bg-danger status-badge shadow-sm">Sin Stock</span>';
                    } else if (stock <= min) {
                        return '<span class="badge bg-warning text-dark status-badge shadow-sm">Stock Crítico</span>';
                    }
                    return '<span class="badge bg-success status-badge shadow-sm">Óptimo</span>';
                }
            },
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function (row) {
                    return `
                        <div class="d-flex gap-1 justify-content-center flex-wrap">
                            <button class="btn-action btn-edit btn-edit-inv" data-id="${row.id}" title="Editar producto">
                                <i class="bi bi-pencil-fill"></i>
                            </button>
                            <button class="btn-action btn-add btn-add-stock" data-id="${row.id}" data-nombre="${row.nombre}" data-stock="${row.stock || 0}" title="Agregar stock">
                                <i class="bi bi-plus-circle-fill"></i>
                            </button>
                            <button class="btn-action btn-view btn-update-stock" data-id="${row.id}" data-nombre="${row.nombre}" data-stock="${row.stock || 0}" title="Actualizar stock">
                                <i class="bi bi-arrow-repeat"></i>
                            </button>
                            <button class="btn-action btn-status btn-status-inv" data-id="${row.id}" title="Cambiar estado">
                                <i class="bi bi-slash-circle-fill"></i>
                            </button>
                            <button class="btn-action btn-delete btn-delete-inv" data-id="${row.id}" title="Eliminar">
                                <i class="bi bi-trash3-fill"></i>
                            </button>
                            <button class="btn btn-outline-primary btn-sm px-2 btn-historial-inv" data-id="${row.id}" data-nombre="${row.nombre}" title="Historial de ventas">
                                <i class="bi bi-clock-history"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json'
        }
    });

    $('#tablaInventario').on('click', '.btn-historial-inv', function () {
        abrirHistorialVentas($(this).data('id'), $(this).data('nombre'));
    });

    $('#tablaInventario').on('click', '.btn-add-stock', function () {
        const id = $(this).data('id');
        const nombre = $(this).data('nombre');
        const stockActual = $(this).data('stock');

        Swal.fire({
            title: 'Agregar stock',
            html: `<p class="text-muted mb-2">${nombre}</p><p>Stock actual: <strong>${stockActual} uds.</strong></p>`,
            input: 'number',
            inputAttributes: { min: 1, step: 1 },
            inputLabel: 'Cantidad a agregar',
            showCancelButton: true,
            confirmButtonText: 'Agregar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => !value || value <= 0 ? 'Ingrese una cantidad válida' : null
        }).then((result) => {
            if (result.isConfirmed) {
                actualizarStock(id, parseInt(result.value), 'agregar', tablaInventario);
            }
        });
    });

    $('#tablaInventario').on('click', '.btn-update-stock', function () {
        const id = $(this).data('id');
        const nombre = $(this).data('nombre');
        const stockActual = $(this).data('stock');

        Swal.fire({
            title: 'Actualizar stock',
            html: `<p class="text-muted mb-2">${nombre}</p><p>Stock actual: <strong>${stockActual} uds.</strong></p>`,
            input: 'number',
            inputValue: stockActual,
            inputAttributes: { min: 0, step: 1 },
            inputLabel: 'Nuevo stock',
            showCancelButton: true,
            confirmButtonText: 'Actualizar',
            cancelButtonText: 'Cancelar',
            inputValidator: (value) => value === '' || value < 0 ? 'Ingrese un stock válido' : null
        }).then((result) => {
            if (result.isConfirmed) {
                actualizarStock(id, parseInt(result.value), 'establecer', tablaInventario);
            }
        });
    });

    $('#tablaInventario').on('click', '.btn-edit-inv', function () {
        window.location.href = `/productos/listar?edit=${$(this).data('id')}`;
    });

    $('#tablaInventario').on('click', '.btn-delete-inv', function () {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Eliminar producto?',
            text: 'Se cambiará el estado a Inactivo',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, eliminar'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/productos/api/eliminar/${id}`, {
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                }).then(res => res.json()).then(res => {
                    if (res.success) {
                        Swal.fire('Eliminado', res.message, 'success');
                        tablaInventario.ajax.reload();
                    } else {
                        Swal.fire('Error', res.message, 'error');
                    }
                });
            }
        });
    });

    $('#tablaInventario').on('click', '.btn-status-inv', function () {
        const id = $(this).data('id');
        fetch(`/productos/api/${id}`).then(res => res.json()).then(res => {
            if (res.success) {
                const p = res.data;
                const nuevoEstado = p.estado === 1 ? 2 : 1;
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
                        tablaInventario.ajax.reload();
                    }
                });
            }
        });
    });
});

function actualizarStock(id, cantidad, operacion, tabla) {
    fetch(`/inventario/api/actualizar-stock/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getCsrfHeaders()
        },
        body: JSON.stringify({ cantidad, operacion })
    }).then(res => res.json()).then(res => {
        if (res.success) {
            Swal.fire('Éxito', res.message, 'success');
            tabla.ajax.reload();
        } else {
            Swal.fire('Error', res.message, 'error');
        }
    });
}

function obtenerValorMapa(obj, ...claves) {
    for (const clave of claves) {
        if (obj[clave] !== undefined && obj[clave] !== null) return obj[clave];
        const minuscula = clave.toLowerCase();
        if (obj[minuscula] !== undefined && obj[minuscula] !== null) return obj[minuscula];
    }
    return null;
}

function abrirHistorialVentas(productoId, nombreProducto) {
    $('#txtNombreProductoHeader').text(`${nombreProducto} (${productoId})`);
    const tbody = $('#listaHistorialVentas');

    tbody.html('<tr><td colspan="10" class="py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Buscando historial de ventas...</td></tr>');
    $('#lblTotalVendidoGlobal').text('S/. 0.00');
    $('#lblContadorVentas').text('0 venta(s) encontrada(s)');

    $.get(`/api/inventario/producto/${productoId}/ventas`, function (respuesta) {
        tbody.empty();

        let totalAcumulado = 0;
        let ventasContador = 0;

        if (respuesta && respuesta.length > 0) {
            ventasContador = respuesta.length;

            respuesta.forEach(item => {
                const estado = obtenerValorMapa(item, 'estado') || 'COMPLETADA';
                const subtotal = parseFloat(obtenerValorMapa(item, 'subtotal') || 0);
                const precioUnitario = parseFloat(obtenerValorMapa(item, 'precioUnitario', 'precio_unitario', 'precio_venta') || 0);
                const idVenta = obtenerValorMapa(item, 'idVenta', 'id_venta', 'idventa');
                const numDoc = obtenerValorMapa(item, 'numDoc', 'numero_documento', 'numdoc') || '—';
                const fecha = obtenerValorMapa(item, 'fecha');
                const cliente = obtenerValorMapa(item, 'cliente') || 'CLIENTE GENERAL';
                const vendedor = obtenerValorMapa(item, 'vendedor') || 'Sistema';
                const formaPago = obtenerValorMapa(item, 'formaPago', 'forma_pago', 'formapago') || 'EFECTIVO';
                const cantidad = obtenerValorMapa(item, 'cantidad') || 0;

                if (estado !== 'ANULADA') {
                    totalAcumulado += subtotal;
                }

                const fechaFormateada = fecha ? new Date(fecha).toLocaleString('es-PE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true
                }) : '—';

                let badgeEstado = '<span class="badge bg-success status-badge text-uppercase">COMPLETADA</span>';
                let filaEstilo = '';
                if (estado === 'ANULADA') {
                    badgeEstado = '<span class="badge bg-danger status-badge text-uppercase">ANULADA</span>';
                    filaEstilo = 'style="background-color: #fce8e6;"';
                }

                tbody.append(`
                    <tr ${filaEstilo}>
                        <td class="fw-bold">#${idVenta ?? '—'}</td>
                        <td class="text-muted">${numDoc}</td>
                        <td>${fechaFormateada}</td>
                        <td class="text-uppercase small">${cliente}</td>
                        <td>${vendedor}</td>
                        <td><span class="badge bg-light text-dark border">${formaPago}</span></td>
                        <td class="fw-bold">${cantidad}</td>
                        <td>S/. ${precioUnitario.toFixed(2)}</td>
                        <td class="fw-bold ${estado === 'ANULADA' ? 'text-muted' : 'text-success'}">
                            S/. ${subtotal.toFixed(2)}
                        </td>
                        <td>${badgeEstado}</td>
                    </tr>
                `);
            });

            $('#lblContadorVentas').text(`${ventasContador} venta(s) encontrada(s)`);
            $('#lblTotalVendidoGlobal').text(`S/. ${totalAcumulado.toFixed(2)}`);
        } else {
            tbody.html('<tr><td colspan="10" class="text-muted py-4">Este producto no registra transacciones de venta aún.</td></tr>');
        }

        $('#historialVentasModal').modal('show');
    }).fail(function () {
        Swal.fire('Error', 'No se pudo obtener el historial transaccional del producto.', 'error');
    });
}
