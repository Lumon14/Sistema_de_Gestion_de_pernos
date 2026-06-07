$(document).ready(function() {
    let tabla;
    let modalNueva, modalPago;

    modalNueva = new bootstrap.Modal(document.getElementById('modalNuevaCuenta'));
    modalPago = new bootstrap.Modal(document.getElementById('modalPagoCobrar'));

    tabla = $('#tablaCuentasCobrar').DataTable({
        ajax: { url: '/cuentas-cobrar/api/listar', dataSrc: 'data' },
        order: [[0, 'desc']],
        columns: [
            { data: 'id' },
            { data: 'cliente', render: c => c ? c.nombre : '-' },
            {
                data: 'venta',
                render: v => {
                    if (!v) return '-';
                    return `${v.tipoComprobante || 'VENTA'} ${v.serie || ''}-${v.numeroComprobante || v.id}`;
                }
            },
            { data: 'saldoPendiente', render: d => `<strong>S/. ${parseFloat(d).toFixed(2)}</strong>` },
            {
                data: 'estado',
                render: e => {
                    const map = {
                        PENDIENTE: 'bg-warning text-dark',
                        PARCIAL: 'bg-info text-dark',
                        PAGADO: 'bg-success',
                        VENCIDO: 'bg-danger'
                    };
                    return `<span class="badge ${map[e] || 'bg-secondary'}">${e}</span>`;
                }
            },
            {
                data: null,
                className: 'text-center',
                render: (row) => {
                    if (row.estado === 'PAGADO') return '-';
                    return `<div class="d-flex gap-1 justify-content-center">
                        <button class="btn btn-sm btn-success btn-pagar" data-id="${row.id}" data-saldo="${row.saldoPendiente}" title="Registrar cobro">
                            <i class="bi bi-cash"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-vencer" data-id="${row.id}" title="Marcar vencida">
                            <i class="bi bi-clock-history"></i>
                        </button>
                    </div>`;
                }
            }
        ],
        language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        dom: 'rtip'
    });

    $('#btnNuevaCuenta').on('click', () => {
        fetch('/cuentas-cobrar/api/ventas-disponibles')
            .then(r => r.json())
            .then(data => {
                const sel = $('#selectVentaCuenta');
                sel.empty();
                if (!data.data || data.data.length === 0) {
                    sel.append('<option value="">No hay ventas disponibles</option>');
                } else {
                    sel.append('<option value="">Seleccione...</option>');
                    data.data.forEach(v => {
                        const cliente = v.cliente ? v.cliente.nombre : 'General';
                        sel.append(`<option value="${v.id}">#${v.id} - ${cliente} - S/. ${parseFloat(v.total).toFixed(2)}</option>`);
                    });
                }
                modalNueva.show();
            });
    });

    $('#btnConfirmarGenerar').on('click', () => {
        const ventaId = $('#selectVentaCuenta').val();
        if (!ventaId) {
            Swal.fire('Atención', 'Seleccione una venta', 'warning');
            return;
        }
        fetch(`/cuentas-cobrar/api/generar-desde-venta/${ventaId}`, {
            method: 'POST',
            headers: getCsrfHeaders()
        }).then(r => r.json()).then(data => {
            if (data.success) {
                modalNueva.hide();
                Swal.fire('Éxito', data.message, 'success');
                tabla.ajax.reload();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        });
    });

    $('#tablaCuentasCobrar').on('click', '.btn-pagar', function() {
        $('#pagoCuentaId').val($(this).data('id'));
        $('#pagoMonto').val(parseFloat($(this).data('saldo')).toFixed(2));
        modalPago.show();
    });

    $('#btnConfirmarPago').on('click', () => {
        const id = $('#pagoCuentaId').val();
        const monto = parseFloat($('#pagoMonto').val());
        fetch(`/cuentas-cobrar/api/${id}/registrar-pago`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
            body: JSON.stringify({ monto, metodoPago: $('#pagoMetodo').val() })
        }).then(r => r.json()).then(data => {
            if (data.success) {
                modalPago.hide();
                Swal.fire('Cobro registrado', data.message, 'success');
                tabla.ajax.reload();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        });
    });

    $('#tablaCuentasCobrar').on('click', '.btn-vencer', function() {
        const id = $(this).data('id');
        Swal.fire({
            title: '¿Marcar como vencida?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí'
        }).then(r => {
            if (r.isConfirmed) {
                fetch(`/cuentas-cobrar/api/${id}/marcar-vencida`, {
                    method: 'POST',
                    headers: getCsrfHeaders()
                }).then(res => res.json()).then(data => {
                    if (data.success) {
                        tabla.ajax.reload();
                        Swal.fire('Actualizado', data.message, 'success');
                    }
                });
            }
        });
    });
});
