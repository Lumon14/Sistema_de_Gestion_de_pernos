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
        },
        dom: 'rtip'
    });

    setupTableSearch('#buscadorInventario', tablaInventario);

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

    $('#btnExportHistorialPdf').on('click', exportarHistorialPDF);
    $('#btnExportHistorialExcel').on('click', exportarHistorialExcel);
});

let historialActual = { productoId: null, nombreProducto: null, filas: [], totalVendido: 0, contador: 0 };

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

    historialActual = { productoId, nombreProducto, filas: [], totalVendido: 0, contador: 0 };

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

                historialActual.filas.push({
                    idVenta: idVenta ?? '—',
                    numDoc,
                    fecha: fechaFormateada,
                    cliente,
                    vendedor,
                    formaPago,
                    cantidad,
                    precioUnitario,
                    subtotal,
                    estado
                });

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

            historialActual.totalVendido = totalAcumulado;
            historialActual.contador = ventasContador;
            $('#lblContadorVentas').text(`${ventasContador} venta(s) encontrada(s)`);
            $('#lblTotalVendidoGlobal').text(`S/. ${totalAcumulado.toFixed(2)}`);
        } else {
            tbody.html('<tr><td colspan="10" class="text-muted py-4">Este producto no registra transacciones de venta aún.</td></tr>');
        }

        const modalEl = document.getElementById('historialVentasModal');
        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }).fail(function () {
        Swal.fire('Error', 'No se pudo obtener el historial transaccional del producto.', 'error');
    });
}

function cargarJsPdf() {
    if (window.jspdf && window.jspdf.jsPDF) {
        return Promise.resolve(window.jspdf.jsPDF);
    }
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => resolve(window.jspdf.jsPDF);
        script.onerror = () => reject(new Error('No se pudo cargar jsPDF'));
        document.head.appendChild(script);
    });
}

function exportarHistorialPDF() {
    if (!historialActual.filas.length) {
        Swal.fire('Sin datos', 'No hay ventas para exportar.', 'info');
        return;
    }

    cargarJsPdf().then((jsPDF) => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
        const margen = 14;
        let y = 18;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('PERNOS VEGA — Historial de Ventas', margen, y);
        y += 7;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Producto: ${historialActual.nombreProducto} (ID ${historialActual.productoId})`, margen, y);
        y += 5;
        doc.text(`${historialActual.contador} venta(s) — Total vendido: S/. ${historialActual.totalVendido.toFixed(2)}`, margen, y);
        y += 8;

        const cols = ['ID', 'N° Doc', 'Fecha', 'Cliente', 'Vendedor', 'F.Pago', 'Cant.', 'P.Unit.', 'Subtotal', 'Estado'];
        const widths = [14, 38, 32, 40, 28, 22, 14, 20, 22, 22];
        let x = margen;

        doc.setFillColor(30, 58, 95);
        doc.rect(margen, y, 269, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        cols.forEach((col, i) => {
            doc.text(col, x + 1, y + 5);
            x += widths[i];
        });
        y += 7;

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        historialActual.filas.forEach((fila, idx) => {
            if (y > 190) {
                doc.addPage();
                y = 18;
            }
            if (idx % 2 === 1) {
                doc.setFillColor(248, 250, 252);
                doc.rect(margen, y, 269, 6, 'F');
            }
            x = margen;
            const valores = [
                `#${fila.idVenta}`,
                String(fila.numDoc).substring(0, 22),
                String(fila.fecha).substring(0, 18),
                String(fila.cliente).substring(0, 22),
                String(fila.vendedor).substring(0, 16),
                String(fila.formaPago).substring(0, 12),
                String(fila.cantidad),
                `S/. ${fila.precioUnitario.toFixed(2)}`,
                `S/. ${fila.subtotal.toFixed(2)}`,
                String(fila.estado)
            ];
            valores.forEach((val, i) => {
                doc.text(val, x + 1, y + 4.5);
                x += widths[i];
            });
            y += 6;
        });

        const nombreArchivo = `Historial_Ventas_${historialActual.productoId}.pdf`;
        doc.save(nombreArchivo);
    }).catch(() => Swal.fire('Error', 'No se pudo generar el PDF.', 'error'));
}

function exportarHistorialExcel() {
    if (!historialActual.filas.length) {
        Swal.fire('Sin datos', 'No hay ventas para exportar.', 'info');
        return;
    }

    const encabezados = ['ID Venta', 'N° Doc', 'Fecha', 'Cliente', 'Vendedor', 'Forma Pago', 'Cantidad', 'Precio Unit.', 'Subtotal', 'Estado'];
    const filas = historialActual.filas.map(f => [
        f.idVenta,
        f.numDoc,
        f.fecha,
        f.cliente,
        f.vendedor,
        f.formaPago,
        f.cantidad,
        f.precioUnitario.toFixed(2),
        f.subtotal.toFixed(2),
        f.estado
    ]);

    const escapar = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csv = [
        encabezados.map(escapar).join(','),
        ...filas.map(row => row.map(escapar).join(',')),
        '',
        escapar('Total vendido'), escapar(`S/. ${historialActual.totalVendido.toFixed(2)}`)
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Historial_Ventas_${historialActual.productoId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
