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
            {
                data: 'fechaCreacion',
                render: d => {
                    if (!d) return '-';
                    try {
                        const date = new Date(d);
                        return date.toLocaleString('es-PE');
                    } catch (e) {
                        return d;
                    }
                }
            },
            {
                data: 'fechaPago',
                render: d => {
                    if (!d) return '-';
                    try {
                        const date = new Date(d + 'T00:00:00');
                        return date.toLocaleDateString('es-PE');
                    } catch (e) {
                        return d;
                    }
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

    let saldoActual = 0;

    function calcularDistribucion() {
        const ef = parseFloat($('#pagoEfectivo').val()) || 0;
        const yp = parseFloat($('#pagoYape').val()) || 0;
        const tr = parseFloat($('#pagoTransferencia').val()) || 0;
        const tj = parseFloat($('#pagoTarjeta').val()) || 0;

        const totalDistribuido = Math.round((ef + yp + tr + tj) * 100.0) / 100.0;
        const restante = Math.round((saldoActual - totalDistribuido) * 100.0) / 100.0;

        $('#totalDistribuidoDisplay').text(`S/ ${totalDistribuido.toFixed(2)}`);
        $('#restanteDisplay').text(`S/ ${restante.toFixed(2)}`);

        const alerta = $('#alertaPagoDistribucion');
        const btn = $('#btnConfirmarPago');

        if (restante < 0) {
            alerta.html('<div class="alert alert-danger py-1 px-2 small mb-0 fw-semibold"><i class="bi bi-x-circle-fill me-1"></i>El monto total supera el saldo pendiente.</div>');
            btn.prop('disabled', true);
            $('#restanteDisplay').removeClass('text-success text-muted').addClass('text-danger');
        } else if (totalDistribuido <= 0) {
            alerta.html('<div class="alert alert-warning py-1 px-2 small mb-0 fw-semibold"><i class="bi bi-exclamation-triangle-fill me-1"></i>Ingrese al menos un monto para cobrar.</div>');
            btn.prop('disabled', true);
            $('#restanteDisplay').removeClass('text-success text-danger').addClass('text-muted');
        } else {
            alerta.html('<div class="alert alert-success py-1 px-2 small mb-0 fw-semibold"><i class="bi bi-check-circle-fill me-1"></i>Distribución correcta.</div>');
            btn.prop('disabled', false);
            $('#restanteDisplay').removeClass('text-danger text-muted').addClass('text-success');
        }
    }

    $('.input-distribucion-pago').on('input change', calcularDistribucion);

    $('#tablaCuentasCobrar').on('click', '.btn-pagar', function() {
        const id = $(this).data('id');
        saldoActual = parseFloat($(this).data('saldo'));

        $('#pagoCuentaId').val(id);
        $('#saldoPendienteDisplay').val(saldoActual.toFixed(2));
        
        // Default: pay full amount in cash
        $('#pagoEfectivo').val(saldoActual.toFixed(2));
        $('#pagoYape').val('0.00');
        $('#pagoTransferencia').val('0.00');
        $('#pagoTarjeta').val('0.00');

        calcularDistribucion();
        modalPago.show();
    });

    $('#btnConfirmarPago').on('click', () => {
        const id = $('#pagoCuentaId').val();
        const ef = parseFloat($('#pagoEfectivo').val()) || 0;
        const yp = parseFloat($('#pagoYape').val()) || 0;
        const tr = parseFloat($('#pagoTransferencia').val()) || 0;
        const tj = parseFloat($('#pagoTarjeta').val()) || 0;

        const totalDistribuido = Math.round((ef + yp + tr + tj) * 100.0) / 100.0;

        // Determine method name
        let methods = [];
        if (ef > 0) methods.push('EFECTIVO');
        if (yp > 0) methods.push('YAPE');
        if (tr > 0) methods.push('TRANSFERENCIA');
        if (tj > 0) methods.push('TARJETA');

        const metodoPago = methods.length > 1 ? 'MIXTO' : (methods[0] || 'EFECTIVO');

        fetch(`/cuentas-cobrar/api/${id}/registrar-pago`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
            body: JSON.stringify({
                monto: totalDistribuido,
                metodoPago: metodoPago,
                montoEfectivo: ef,
                montoYape: yp,
                montoTransferencia: tr,
                montoTarjeta: tj
            })
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
