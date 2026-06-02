/**
 * Script para la gestión de ventas y notas de venta
 * Archivo: src/main/resources/static/js/ventas.js
 */

$(document).ready(function() {
    // Variables globales
    let dataTable;
    let itemsVenta = [];
    let ventaModal;
    let verVentaModal;
    let selectedClienteId = null;

    // Inicializar Componentes
    initializeDataTable();
    ventaModal = new bootstrap.Modal(document.getElementById('ventaModal'));
    verVentaModal = new bootstrap.Modal(document.getElementById('verVentaModal'));
    
    // Inicializar Select2
    $('.select2-producto').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#ventaModal')
    });

    initializeSelect2Cliente();

    // Event Listeners
    setupEventListeners();

    /**
     * Inicializa DataTable para listar ventas
     */
    function initializeDataTable() {
        dataTable = $('#tablaVentas').DataTable({
            responsive: true,
            ajax: {
                url: '/ventas/api/listar',
                dataSrc: 'data'
            },
            order: [[1, 'desc']], // Ordenar por fecha descendente
            columns: [
                { 
                    data: 'id',
                    render: (data, type, row) => {
                        if (row.tipoComprobante && row.serie && row.numeroComprobante) {
                            return `<span class="fw-bold text-dark">${row.tipoComprobante}</span><br><small class="text-muted font-monospace">${row.serie}-${row.numeroComprobante}</small>`;
                        }
                        return `<span class="fw-bold">NOTA DE VENTA</span><br><small class="text-muted">#${data}</small>`;
                    }
                },
                { 
                    data: 'fecha',
                    render: (data) => new Date(data).toLocaleString()
                },
                { 
                    data: 'cliente',
                    render: (data) => data ? data.nombre : 'Cliente General'
                },
                { 
                    data: 'usuario',
                    render: (data) => data ? data.nombre : 'Sist.'
                },
                { 
                    data: 'total',
                    render: (data) => `<strong>S/. ${parseFloat(data).toFixed(2)}</strong>`
                },
                { 
                    data: 'estado',
                    render: (data) => data === 1 ? '<span class="badge bg-success">Procesada</span>' : '<span class="badge bg-danger">Cancelada</span>'
                },
                {
                    data: null,
                    className: 'text-center',
                    render: (data, type, row) => `
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-sm btn-outline-primary action-view" data-id="${row.id}" title="Ver Detalle">
                                <i class="bi bi-eye-fill"></i>
                            </button>
                            ${row.estado === 1 ? `
                                <button class="btn btn-sm btn-outline-danger action-cancel" data-id="${row.id}" title="Cancelar Venta">
                                    <i class="bi bi-x-circle-fill"></i>
                                </button>
                            ` : ''}
                        </div>
                    `
                }
            ],
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
        });
    }

    /**
     * Configura Select2 para clientes con búsqueda remota
     */
    function initializeSelect2Cliente() {
        $('.select2-cliente').select2({
            theme: 'bootstrap-5',
            dropdownParent: $('#ventaModal'),
            placeholder: 'Buscar cliente...',
            ajax: {
                url: '/clientes/api/listar',
                processResults: function (data) {
                    return {
                        results: data.data.map(c => ({
                            id: c.id,
                            text: `${c.dniRuc} - ${c.nombre}`,
                            data: c
                        }))
                    };
                }
            }
        }).on('select2:select', function (e) {
            selectedClienteId = e.params.data.id;
            $('#datosNuevoCliente').addClass('d-none');
        });
    }

    /**
     * Event Listeners
     */
    function setupEventListeners() {
        $('#btnNuevaVenta').on('click', () => {
            resetVentaForm();
            ventaModal.show();
        });

        $('#selectProducto').on('change', function() {
            const precio = $(this).find(':selected').data('precio');
            $('#inputPrecio').val(precio ? parseFloat(precio).toFixed(2) : '');
        });

        $('#btnAgregarProducto').on('click', agregarProductoALista);

        $('#tablaDetalles').on('click', '.btn-remove-item', function() {
            const index = $(this).data('index');
            itemsVenta.splice(index, 1);
            renderizarListaDetalles();
        });

        $('#btnProcesarVenta').on('click', procesarVenta);

        $('#tablaVentas tbody').on('click', '.action-view', function() {
            const id = $(this).data('id');
            verDetalleVenta(id);
        });

        $('#tablaVentas tbody').on('click', '.action-cancel', function() {
            const id = $(this).data('id');
            confirmarCancelacion(id);
        });

        $('#btnCompartirWhatsApp').on('click', compartirPorWhatsApp);
    }

    /**
     * Agrega un producto a la lista temporal
     */
    function agregarProductoALista() {
        const prodId = $('#selectProducto').val();
        const prodNombre = $('#selectProducto option:selected').text().split(' (')[0];
        const cantidad = parseInt($('#inputCantidad').val());
        const precio = parseFloat($('#inputPrecio').val());
        const stock = parseInt($('#selectProducto option:selected').data('stock'));

        if (!prodId) {
            Swal.fire('Error', 'Seleccione un producto', 'warning');
            return;
        }

        if (cantidad > stock) {
            Swal.fire('Stock insuficiente', `Solo hay ${stock} unidades disponibles`, 'error');
            return;
        }

        const existingItem = itemsVenta.find(i => i.productoId == prodId);
        if (existingItem) {
            if ((existingItem.cantidad + cantidad) > stock) {
                Swal.fire('Stock insuficiente', 'La cantidad acumulada supera el stock disponible', 'error');
                return;
            }
            existingItem.cantidad += cantidad;
        } else {
            itemsVenta.push({
                productoId: prodId,
                nombre: prodNombre,
                cantidad: cantidad,
                precio: precio
            });
        }

        $('#selectProducto').val(null).trigger('change');
        $('#inputCantidad').val(1);
        $('#inputPrecio').val('');
        renderizarListaDetalles();
    }

    /**
     * Renderiza la tabla de detalles en el modal
     */
    function renderizarListaDetalles() {
        const tbody = $('#tablaDetalles tbody');
        tbody.empty();
        let total = 0;

        itemsVenta.forEach((item, index) => {
            const subtotal = item.cantidad * item.precio;
            total += subtotal;
            tbody.append(`
                <tr>
                    <td>${item.nombre}</td>
                    <td class="text-center">${item.cantidad}</td>
                    <td class="text-end">S/. ${item.precio.toFixed(2)}</td>
                    <td class="text-end fw-bold">S/. ${subtotal.toFixed(2)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-link text-danger btn-remove-item" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
        });

        $('#totalVenta').text(total.toFixed(2));
        $('#infoItems').text(`${itemsVenta.length} productos seleccionados`);
    }

    /**
     * Procesa y guarda la venta
     */
    function procesarVenta() {
        if (!selectedClienteId) {
            Swal.fire('Error', 'Debe seleccionar un cliente', 'warning');
            return;
        }

        if (itemsVenta.length === 0) {
            Swal.fire('Error', 'Debe añadir al menos un producto', 'warning');
            return;
        }

        const ventaData = {
            cliente: { id: selectedClienteId },
            total: parseFloat($('#totalVenta').text()),
            detalles: itemsVenta.map(item => ({
                producto: { id: item.productoId },
                cantidad: item.cantidad,
                precioVenta: item.precio
            }))
        };

        Swal.fire({
            title: '¿Confirmar venta?',
            text: `Total a cobrar: S/. ${ventaData.total.toFixed(2)}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, procesar',
            cancelButtonText: 'Revisar'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);
                fetch('/ventas/api/guardar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCsrfHeaders()
                    },
                    body: JSON.stringify(ventaData)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        ventaModal.hide();
                        Swal.fire('¡Éxito!', 'Venta registrada correctamente', 'success');
                        dataTable.ajax.reload();
                    } else {
                        Swal.fire('Error', data.message, 'error');
                    }
                })
                .catch(() => Swal.fire('Error', 'Error de conexión', 'error'))
                .finally(() => showLoading(false));
            }
        });
    }

    /**
     * Ver detalle de una venta
     */
    function verDetalleVenta(id) {
        showLoading(true);
        fetch(`/ventas/api/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const venta = data.data;
                    $('#verVentaId').text(venta.id);
                    
                    let comprobanteInfo = '';
                    if (venta.tipoComprobante && venta.serie && venta.numeroComprobante) {
                        comprobanteInfo = `<p class="mb-1"><strong>Comprobante:</strong> <span class="badge bg-dark">${venta.tipoComprobante} ${venta.serie}-${venta.numeroComprobante}</span></p>`;
                    } else {
                        comprobanteInfo = `<p class="mb-1"><strong>Comprobante:</strong> <span class="badge bg-secondary">Nota de Venta #${venta.id}</span></p>`;
                    }

                    let html = `
                        <div class="mb-3">
                            <p class="mb-1"><strong>Cliente:</strong> ${venta.cliente ? venta.cliente.nombre : 'General'}</p>
                            ${comprobanteInfo}
                            <p class="mb-1"><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString()}</p>
                            <p class="mb-1"><strong>Vendedor:</strong> ${venta.usuario ? venta.usuario.nombre : '-'}</p>
                        </div>
                        <table class="table table-sm align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>Producto</th>
                                    <th class="text-center">Cant.</th>
                                    <th class="text-end">Precio</th>
                                    <th class="text-end">Desct.</th>
                                    <th class="text-end">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                    `;

                    venta.detalles.forEach(d => {
                        const descuentoVal = d.descuento !== null && d.descuento !== undefined ? d.descuento : 0.0;
                        const subtotalVal = d.subtotal !== null && d.subtotal !== undefined ? d.subtotal : (d.cantidad * d.precioVenta - descuentoVal);
                        html += `
                            <tr>
                                <td>${d.producto.nombre}</td>
                                <td class="text-center">${d.cantidad}</td>
                                <td class="text-end">S/. ${d.precioVenta.toFixed(2)}</td>
                                <td class="text-end">S/. ${descuentoVal.toFixed(2)}</td>
                                <td class="text-end fw-bold">S/. ${subtotalVal.toFixed(2)}</td>
                            </tr>
                        `;
                    });

                    // Calcular desglose si las columnas vienen nulas por registros antiguos
                    const subtotalVenta = venta.subtotal !== null && venta.subtotal !== undefined ? venta.subtotal : (venta.total / 1.18);
                    const igvVenta = venta.igv !== null && venta.igv !== undefined ? venta.igv : (venta.total - subtotalVenta);

                    html += `
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th colspan="4" class="text-end text-muted font-monospace small py-1">SUBTOTAL</th>
                                    <th class="text-end text-muted font-monospace small py-1">S/. ${subtotalVenta.toFixed(2)}</th>
                                </tr>
                                <tr>
                                    <th colspan="4" class="text-end text-muted font-monospace small py-1">IGV (18%)</th>
                                    <th class="text-end text-muted font-monospace small py-1">S/. ${igvVenta.toFixed(2)}</th>
                                </tr>
                                <tr>
                                    <th colspan="4" class="text-end py-2">TOTAL</th>
                                    <th class="text-end text-primary fs-5 py-2">S/. ${venta.total.toFixed(2)}</th>
                                </tr>
                            </tfoot>
                        </table>
                    `;

                    $('#verVentaContent').html(html);
                    $('#verVentaModal').data('venta', venta); // Guardar para WhatsApp
                    verVentaModal.show();
                }
            })
            .finally(() => showLoading(false));
    }

    /**
     * Cancela una venta
     */
    function confirmarCancelacion(id) {
        Swal.fire({
            title: '¿Cancelar esta venta?',
            text: "El stock de los productos será devuelto al inventario.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, cancelar venta'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/ventas/api/eliminar/${id}`, { 
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Cancelada', data.message, 'success');
                        dataTable.ajax.reload();
                    }
                });
            }
        });
    }

    /**
     * Genera link de WhatsApp
     */
    function compartirPorWhatsApp() {
        const venta = $('#verVentaModal').data('venta');
        if (!venta) return;

        let comprobanteTxt = '';
        if (venta.tipoComprobante && venta.serie && venta.numeroComprobante) {
            comprobanteTxt = `*Comprobante:* ${venta.tipoComprobante} ${venta.serie}-${venta.numeroComprobante}%0A`;
        } else {
            comprobanteTxt = `*Comprobante:* Nota de Venta %23${venta.id}%0A`;
        }

        let mensaje = `*PEDIDO DE PERNOS VEGA*%0A`;
        mensaje += comprobanteTxt;
        mensaje += `*Cliente:* ${venta.cliente ? venta.cliente.nombre : 'General'}%0A`;
        mensaje += `--------------------------%0A`;
        
        venta.detalles.forEach(d => {
            const descuentoVal = d.descuento !== null && d.descuento !== undefined ? d.descuento : 0.0;
            const subtotalVal = d.subtotal !== null && d.subtotal !== undefined ? d.subtotal : (d.cantidad * d.precioVenta - descuentoVal);
            mensaje += `${d.cantidad} x ${d.producto.nombre} - S/. ${subtotalVal.toFixed(2)}%0A`;
        });

        const subtotalVenta = venta.subtotal !== null && venta.subtotal !== undefined ? venta.subtotal : (venta.total / 1.18);
        const igvVenta = venta.igv !== null && venta.igv !== undefined ? venta.igv : (venta.total - subtotalVenta);

        mensaje += `--------------------------%0A`;
        mensaje += `*Subtotal:* S/. ${subtotalVenta.toFixed(2)}%0A`;
        mensaje += `*IGV (18%):* S/. ${igvVenta.toFixed(2)}%0A`;
        mensaje += `*TOTAL A PAGAR: S/. ${venta.total.toFixed(2)}*%0A`;
        mensaje += `%0A¡Gracias por su preferencia!`;

        const url = `https://wa.me/51968871577?text=${mensaje}`;
        window.open(url, '_blank');
    }

    /**
     * Resetea el formulario
     */
    function resetVentaForm() {
        itemsVenta = [];
        selectedClienteId = null;
        $('.select2-cliente').val(null).trigger('change');
        $('#selectProducto').val(null).trigger('change');
        $('#inputCantidad').val(1);
        $('#inputPrecio').val('');
        renderizarListaDetalles();
    }

    function showLoading(show) {
        if (show) {
            Swal.fire({
                title: 'Procesando...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
        } else {
            Swal.close();
        }
    }
});
