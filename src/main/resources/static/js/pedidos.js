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
                            <div class="d-flex gap-2 justify-content-center">
                                <button class="btn btn-sm btn-outline-primary action-view" data-id="${row.id}" title="Ver Detalle">
                                    <i class="bi bi-eye-fill"></i>
                                </button>
                        `;

                        if (row.estado === 'PENDIENTE') {
                            buttons += `
                                <button class="btn btn-sm btn-outline-success action-approve" data-id="${row.id}" title="Aprobar y Generar Venta">
                                    <i class="bi bi-check-lg"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger action-cancel" data-id="${row.id}" title="Cancelar Pedido">
                                    <i class="bi bi-x-lg"></i>
                                </button>
                            `;
                        }

                        buttons += `</div>`;
                        return buttons;
                    }
                }
            ],
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
        });
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
