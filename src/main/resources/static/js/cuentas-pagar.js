$(document).ready(function() {
    let tabla;
    let modalNueva, modalPago;

    modalNueva = new bootstrap.Modal(document.getElementById('modalNuevaObligacion'));
    modalPago = new bootstrap.Modal(document.getElementById('modalPagoPagar'));

    tabla = $('#tablaCuentasPagar').DataTable({
        ajax: { url: '/cuentas-pagar/api/listar', dataSrc: 'data' },
        order: [[0, 'desc']],
        columns: [
            { data: 'id' },
            { data: 'proveedor', render: p => p ? p.nombre : '-' },
            { data: 'montoTotal', render: d => `S/. ${parseFloat(d).toFixed(2)}` },
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
                render: row => {
                    if (row.estado === 'PAGADO') return '-';
                    return `<button class="btn btn-sm btn-success btn-pagar-prov" data-id="${row.id}" data-saldo="${row.saldoPendiente}">
                        <i class="bi bi-cash"></i> Pagar
                    </button>`;
                }
            }
        ],
        language: { url: '//cdn.datatables.net/plug-ins/1.13.7/i18n/es-ES.json' },
        dom: 'rtip'
    });

    $('#btnNuevaObligacion').on('click', () => {
        $('#selectProveedor, #inputMontoTotal').val('');
        modalNueva.show();
    });

    $('#btnGuardarObligacion').on('click', () => {
        const proveedorId = $('#selectProveedor').val();
        const monto = parseFloat($('#inputMontoTotal').val());
        if (!proveedorId || !monto || monto <= 0) {
            Swal.fire('Atención', 'Complete proveedor y monto válido', 'warning');
            return;
        }
        fetch('/cuentas-pagar/api/guardar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
            body: JSON.stringify({
                proveedor: { id: parseInt(proveedorId, 10) },
                montoTotal: monto
            })
        }).then(r => r.json()).then(data => {
            if (data.success) {
                modalNueva.hide();
                Swal.fire('Registrado', data.message, 'success');
                tabla.ajax.reload();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        });
    });

    $('#tablaCuentasPagar').on('click', '.btn-pagar-prov', function() {
        $('#pagoObligacionId').val($(this).data('id'));
        $('#pagoObligacionMonto').val(parseFloat($(this).data('saldo')).toFixed(2));
        modalPago.show();
    });

    $('#btnConfirmarPagoProveedor').on('click', () => {
        const id = $('#pagoObligacionId').val();
        const monto = parseFloat($('#pagoObligacionMonto').val());
        fetch(`/cuentas-pagar/api/${id}/registrar-pago`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
            body: JSON.stringify({ monto })
        }).then(r => r.json()).then(data => {
            if (data.success) {
                modalPago.hide();
                Swal.fire('Pago registrado', data.message, 'success');
                tabla.ajax.reload();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        });
    });
});
