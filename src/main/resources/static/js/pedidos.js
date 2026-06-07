/**
 * Script para la gestión de pedidos en el dashboard
 * Archivo: src/main/resources/static/js/pedidos.js
 */

$(document).ready(function () {
    let dataTable;
    let verPedidoModal;

    // Inicializar Componentes
    initializeDataTable();
    verPedidoModal = new bootstrap.Modal(document.getElementById('verPedidoModal'));

    // Event Listeners
    setupEventListeners();

    const pedidoParam = new URLSearchParams(window.location.search).get('pedido');
    if (pedidoParam) {
        setTimeout(() => verDetallePedido(pedidoParam), 600);
    }

    /**
     * Inicializa DataTable para listar pedidos
     */
    function initializeDataTable() {
        dataTable = $('#tablaPedidos').DataTable({
            responsive: true,
            ajax: {
                url: '/pedidos/api/listar',
                dataSrc: 'data'
            },
            order: [[0, 'desc']], // Ordenar por ID descendente
            columns: [
                { data: 'id' },
                {
                    data: 'fecha',
                    render: (data) => new Date(data).toLocaleString()
                },
                {
                    data: 'cliente',
                    render: (data) => data ? data.nombre : 'Cliente Desconocido'
                },
                {
                    data: 'cliente',
                    render: (data) => data ? data.dniRuc : '-'
                },
                {
                    data: 'cliente',
                    render: (data) => data ? data.telefono : '-'
                },
                {
                    data: 'total',
                    render: (data) => `<strong>S/. ${parseFloat(data).toFixed(2)}</strong>`
                },
                {
                    data: 'estado',
                    render: (data) => {
                        if (data === 'PENDIENTE') {
                            return '<span class="badge badge-pendiente px-3 py-2"><i class="bi bi-clock me-1"></i>Pendiente</span>';
                        } else if (data === 'COMPLETADO') {
                            return '<span class="badge badge-completado px-3 py-2"><i class="bi bi-check-circle me-1"></i>Completado</span>';
                        } else {
                            return '<span class="badge badge-cancelado px-3 py-2"><i class="bi bi-x-circle me-1"></i>Cancelado</span>';
                        }
                    }
                },
                {
                    data: null,
                    className: 'text-center',
                    render: (data, type, row) => {
                        let buttons = `
                            <div class="d-flex gap-1 justify-content-center">
                                <button class="btn-action btn-view action-view" data-id="${row.id}" title="Ver Detalle">
                                    <i class="bi bi-eye-fill"></i>
                                </button>
                        `;

                        if (row.estado === 'PENDIENTE') {
                            buttons += `
                                <button class="btn-action btn-edit action-edit" data-id="${row.id}" title="Editar Pedido">
                                    <i class="bi bi-pencil-fill"></i>
                                </button>
                                <button class="btn-action btn-status action-approve" data-id="${row.id}" title="Aprobar y Generar Venta">
                                    <i class="bi bi-check-lg"></i>
                                </button>
                                <button class="btn-action btn-delete action-cancel" data-id="${row.id}" title="Cancelar Pedido">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            `;
                        }

                        buttons += `</div>`;
                        return buttons;
                    }
                }
            ],
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" },
            dom: 'rtip'
        });

        setupTableSearch('#buscadorPedidos', dataTable);
    }

    /**
     * Configura los event listeners para las acciones de la tabla
     */
    function setupEventListeners() {
        $('#tablaPedidos tbody').on('click', '.action-view', function () {
            const id = $(this).data('id');
            verDetallePedido(id);
        });

        $('#tablaPedidos tbody').on('click', '.action-approve', function () {
            const id = $(this).data('id');
            confirmarAprobacion(id);
        });

        $('#tablaPedidos tbody').on('click', '.action-cancel', function () {
            const id = $(this).data('id');
            confirmarCancelacion(id);
        });
        
        $('#tablaPedidos tbody').on('click', '.action-edit', function () {
            const id = $(this).data('id');
            abrirEditarPedido(id);
        });
    }

    /**
     * Recupera un pedido por su id desde los datos cargados de la tabla
     */
    function findPedidoLocal(id) {
        const rows = dataTable.rows().data().toArray();
        return rows.find(r => r.id == id);
    }

    /**
     * Abre el modal y dibuja la información detallada del pedido
     */
    function verDetallePedido(id) {
        const pedido = findPedidoLocal(id);
        if (!pedido) return;

        $('#verPedidoId').text(pedido.id);

        let estadoBadge = '';
        if (pedido.estado === 'PENDIENTE') {
            estadoBadge = '<span class="badge badge-pendiente px-2 py-1"><i class="bi bi-clock me-1"></i>Pendiente</span>';
        } else if (pedido.estado === 'COMPLETADO') {
            estadoBadge = '<span class="badge badge-completado px-2 py-1"><i class="bi bi-check-circle me-1"></i>Completado</span>';
        } else {
            estadoBadge = '<span class="badge badge-cancelado px-2 py-1"><i class="bi bi-x-circle me-1"></i>Cancelado</span>';
        }

        const cliente = pedido.cliente || {};

        let html = `
            <div class="row g-3 mb-4">
                <div class="col-md-6 border-end">
                    <h6 class="fw-bold text-muted mb-2"><i class="bi bi-person-fill me-1"></i> Datos del Cliente</h6>
                    <p class="mb-1"><strong>Nombre:</strong> ${cliente.nombre || '-'}</p>
                    <p class="mb-1"><strong>DNI/RUC:</strong> ${cliente.dniRuc || '-'}</p>
                    <p class="mb-1"><strong>Teléfono:</strong> ${cliente.telefono || '-'}</p>
                    <p class="mb-1"><strong>Email:</strong> ${cliente.email || '-'}</p>
                </div>
                <div class="col-md-6 ps-md-4">
                    <h6 class="fw-bold text-muted mb-2"><i class="bi bi-info-circle-fill me-1"></i> Información del Pedido</h6>
                    <p class="mb-1"><strong>Fecha de Registro:</strong> ${new Date(pedido.fecha).toLocaleString()}</p>
                    <p class="mb-1"><strong>Estado Actual:</strong> ${estadoBadge}</p>
                </div>
            </div>
            
            <h6 class="fw-bold text-muted mb-2"><i class="bi bi-box-seam-fill me-1"></i> Productos Solicitados</h6>
            <div class="table-responsive">
                <table class="table table-sm table-bordered align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Producto</th>
                            <th class="text-center" style="width: 100px;">Cantidad</th>
                            <th class="text-end" style="width: 130px;">Precio Unit.</th>
                            <th class="text-end" style="width: 130px;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        pedido.detalles.forEach(d => {
            html += `
                <tr>
                    <td>${d.producto.nombre}</td>
                    <td class="text-center">${d.cantidad}</td>
                    <td class="text-end">S/. ${parseFloat(d.precioUnitario).toFixed(2)}</td>
                    <td class="text-end fw-bold">S/. ${parseFloat(d.subtotal).toFixed(2)}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr class="table-light">
                            <th colspan="3" class="text-end py-2">TOTAL PEDIDO</th>
                            <th class="text-end text-primary fs-5 py-2">S/. ${parseFloat(pedido.total).toFixed(2)}</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;

        $('#verPedidoContent').html(html);

        // Renderizar botones de acción en el pie del modal
        let footerButtons = '';
        if (pedido.estado === 'PENDIENTE') {
            footerButtons = `
                <button type="button" class="btn btn-danger" onclick="executeCancelFromModal(${pedido.id})">Cancelar Pedido</button>
                <button type="button" class="btn btn-success" onclick="executeApproveFromModal(${pedido.id})">Aprobar y Registrar Venta</button>
            `;
        }
        footerButtons += `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>`;
        
        $('#modalActionButtons').html(footerButtons);
        verPedidoModal.show();
    }

    /**
     * Llama al servicio para aprobar y generar la venta del pedido
     */
    function confirmarAprobacion(id) {
        Swal.fire({
            title: '¿Aprobar pedido y registrar venta?',
            text: "Esta acción generará la boleta/factura correspondiente y descontará los productos del stock.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, aprobar',
            cancelButtonText: 'Revisar',
            confirmButtonColor: '#198754'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);
                fetch(`/pedidos/api/${id}/completar`, {
                    method: 'POST',
                    headers: window.getCsrfHeaders()
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('¡Éxito!', data.message, 'success');
                        dataTable.ajax.reload();
                        verPedidoModal.hide();
                    } else {
                        Swal.fire('Error', data.message, 'error');
                    }
                })
                .catch(() => Swal.fire('Error', 'Error de conexión con el servidor', 'error'))
                .finally(() => showLoading(false));
            }
        });
    }

    /**
     * Llama al servicio para cancelar el pedido
     */
    function confirmarCancelacion(id) {
        Swal.fire({
            title: '¿Cancelar este pedido?',
            text: "El pedido pasará a estado cancelado. Esta acción no descontará stock.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            confirmButtonText: 'Sí, cancelar pedido',
            cancelButtonText: 'Volver'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);
                fetch(`/pedidos/api/${id}/cancelar`, {
                    method: 'POST',
                    headers: window.getCsrfHeaders()
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Cancelado', data.message, 'success');
                        dataTable.ajax.reload();
                        verPedidoModal.hide();
                    } else {
                        Swal.fire('Error', data.message, 'error');
                    }
                })
                .catch(() => Swal.fire('Error', 'Error de conexión con el servidor', 'error'))
                .finally(() => showLoading(false));
            }
        });
    }

    // Funciones globales vinculadas al scope de window para ejecutarse desde el modal
    window.executeApproveFromModal = function (id) {
        confirmarAprobacion(id);
    };

    window.executeCancelFromModal = function (id) {
        confirmarCancelacion(id);
    };

    let editarPedidoModal;
    if (document.getElementById('editarPedidoModal')) {
        editarPedidoModal = new bootstrap.Modal(document.getElementById('editarPedidoModal'));
    }

    let editItems = [];
    let listadoProductos = [];

    function cargarProductosParaEdicion() {
        if (listadoProductos.length > 0) {
            return Promise.resolve(listadoProductos);
        }
        return fetch('/productos/api/listar')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    listadoProductos = data.data;
                    const sel = $('#editPedidoSelectProducto');
                    sel.empty().append('<option value="">Seleccione producto...</option>');
                    listadoProductos.forEach(p => {
                        sel.append(`<option value="${p.id}" data-precio="${p.precioVenta}" data-nombre="${p.nombre}">${p.nombre} (S/. ${p.precioVenta.toFixed(2)})</option>`);
                    });
                }
                return listadoProductos;
            });
    }

    function abrirEditarPedido(id) {
        const pedido = findPedidoLocal(id);
        if (!pedido) return;

        $('#editPedidoId').val(pedido.id);
        $('#editPedidoIdLabel').text(pedido.id);

        const c = pedido.cliente || {};
        $('#editPedidoDniRuc').val(c.dniRuc || '');
        $('#editPedidoNombre').val(c.nombre || '');
        $('#editPedidoTelefono').val(c.telefono || '');
        $('#editPedidoEmail').val(c.email || '');
        $('#editPedidoDireccion').val(c.direccion || '');

        editItems = pedido.detalles.map(d => ({
            productoId: d.producto.id,
            nombre: d.producto.nombre,
            precioUnitario: d.precioUnitario,
            cantidad: d.cantidad
        }));

        cargarProductosParaEdicion().then(() => {
            renderEditItems();
            editarPedidoModal.show();
        });
    }

    function renderEditItems() {
        const tbody = $('#editPedidoTablaDetalles tbody');
        tbody.empty();
        let total = 0;

        if (editItems.length === 0) {
            tbody.append('<tr><td colspan="5" class="text-center text-muted">No hay productos en el pedido</td></tr>');
            $('#editPedidoTotalLabel').text('S/ 0.00');
            return;
        }

        editItems.forEach((item, index) => {
            const subtotal = item.cantidad * item.precioUnitario;
            total += subtotal;
            tbody.append(`
                <tr>
                    <td>${item.nombre}</td>
                    <td class="text-end">S/ ${item.precioUnitario.toFixed(2)}</td>
                    <td class="text-center">
                        <input type="number" class="form-control form-control-sm text-center edit-cantidad-item" 
                               value="${item.cantidad}" min="1" data-index="${index}" style="width: 70px; margin: 0 auto;">
                    </td>
                    <td class="text-end fw-semibold">S/ ${subtotal.toFixed(2)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-danger btn-remove-edit-item" data-index="${index}">
                            <i class="bi bi-trash"></i>
                        </button>
                    </td>
                </tr>
            `);
        });

        $('#editPedidoTotalLabel').text(`S/ ${total.toFixed(2)}`);
    }

    $('#btnEditPedidoAgregarItem').on('click', function() {
        const sel = $('#editPedidoSelectProducto');
        const prodId = sel.val();
        const cantidad = parseInt($('#editPedidoCantidad').val(), 10) || 1;
        if (!prodId) {
            Swal.fire('Atención', 'Seleccione un producto', 'warning');
            return;
        }
        const opt = sel.find(':selected');
        const nombre = opt.data('nombre');
        const precio = parseFloat(opt.data('precio'));

        const existing = editItems.find(i => i.productoId == prodId);
        if (existing) {
            existing.cantidad += cantidad;
        } else {
            editItems.push({
                productoId: prodId,
                nombre: nombre,
                precioUnitario: precio,
                cantidad: cantidad
            });
        }
        sel.val('');
        $('#editPedidoCantidad').val(1);
        renderEditItems();
    });

    $('#editPedidoTablaDetalles').on('change', '.edit-cantidad-item', function() {
        const index = $(this).data('index');
        const val = parseInt($(this).val(), 10);
        if (isNaN(val) || val < 1) {
            $(this).val(editItems[index].cantidad);
            return;
        }
        editItems[index].cantidad = val;
        renderEditItems();
    });

    $('#editPedidoTablaDetalles').on('click', '.btn-remove-edit-item', function() {
        const index = $(this).data('index');
        editItems.splice(index, 1);
        renderEditItems();
    });

    $('#formEditarPedido').on('submit', function(e) {
        e.preventDefault();
        const id = $('#editPedidoId').val();
        if (editItems.length === 0) {
            Swal.fire('Atención', 'Debe agregar al menos un producto al pedido', 'warning');
            return;
        }

        const payload = {
            cliente: {
                dniRuc: $('#editPedidoDniRuc').val().trim() || null,
                nombre: $('#editPedidoNombre').val().trim(),
                telefono: $('#editPedidoTelefono').val().trim() || null,
                email: $('#editPedidoEmail').val().trim() || null,
                direccion: $('#editPedidoDireccion').val().trim() || null
            },
            detalles: editItems.map(item => ({
                producto: { id: item.productoId },
                cantidad: item.cantidad
            }))
        };

        showLoading(true);
        fetch(`/pedidos/api/${id}/editar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...window.getCsrfHeaders() },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                editarPedidoModal.hide();
                Swal.fire('Éxito', data.message, 'success');
                dataTable.ajax.reload();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        })
        .catch(() => Swal.fire('Error', 'Error de conexión', 'error'))
        .finally(() => showLoading(false));
    });

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
