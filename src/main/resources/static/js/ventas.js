/**
 * Script para la gestión de ventas y notas de venta
 * Archivo: src/main/resources/static/js/ventas.js
 * Requiere: jsPDF (cargado dinámicamente si no existe)
 */

$(document).ready(function() {
    // Variables globales
    let dataTable;
    let itemsVenta = [];
    let ventaModal;
    let verVentaModal;
    let emailModal;
    let selectedClienteId = null;
    let selectedClienteNombre = null;
    let clienteGeneralId = null;
    let currentVentaForEmail = null; // Venta activa para el modal de correo

    // Inicializar Componentes
    initializeDataTable();
    ventaModal  = new bootstrap.Modal(document.getElementById('ventaModal'));
    verVentaModal = new bootstrap.Modal(document.getElementById('verVentaModal'));
    emailModal  = new bootstrap.Modal(document.getElementById('emailModal'));
    
    // Inicializar Select2
    $('.select2-producto').select2({
        theme: 'bootstrap-5',
        dropdownParent: $('#ventaModal'),
        placeholder: 'Buscar familia, modelo o código...',
        allowClear: true
    });

    cargarClienteGeneral();

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

    function cargarClienteGeneral() {
        fetch('/clientes/api/listar')
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;
                const general = data.data.find(c =>
                    (c.nombre && c.nombre.toLowerCase().includes('general')) ||
                    c.dniRuc === '00000000'
                );
                if (general) clienteGeneralId = general.id;
            })
            .catch(() => {});
    }

    function aplicarCliente(id, nombre, dniRuc) {
        selectedClienteId = id;
        selectedClienteNombre = nombre;
        $('#clienteActivoInfo').html(
            `<i class="bi bi-person-check-fill me-1"></i>Cliente Activo: <span class="text-uppercase">${nombre}</span>`
        );
        if (dniRuc) {
            $('#inputBuscarCliente').val(dniRuc);
            $('#inputComprobante').val(
                dniRuc.length === 11 ? 'FACTURA' : 'NOTA DE VENTA'
            );
        }
        actualizarEstadoCobro();
    }

    function limpiarCliente() {
        selectedClienteId = null;
        selectedClienteNombre = null;
        $('#clienteActivoInfo').empty();
        actualizarEstadoCobro();
    }

    /**
     * Event Listeners
     */
    function setupEventListeners() {
        $('#btnNuevaVenta').on('click', () => {
            resetVentaForm();
            ventaModal.show();
        });

        $('#inputBuscarCliente').on('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                buscarClientePorDocumento($(this).val().trim());
            }
        });

        $('#btnBuscarCliente').on('click', function() {
            buscarClientePorDocumento($('#inputBuscarCliente').val().trim());
        });

        $('#btnClienteGeneral').on('click', seleccionarClienteGeneral);

        $('#selectMetodoPago').on('change', function() {
            const esEfectivo = $(this).val() === 'efectivo';
            $('#boxEfectivo').toggleClass('d-none', !esEfectivo);
            actualizarEstadoCobro();
        });

        $('#inputEfectivoRecibido').on('input', calcularVuelto);

        $('#selectProducto').on('change', function() {
            const precio = $(this).find(':selected').data('precio');
            $('#inputPrecio').val(precio ? parseFloat(precio).toFixed(2) : '');
            if ($(this).val()) {
                agregarProductoALista();
            }
        });

        $('#btnVerCatalogo').on('click', () => window.open('/catalogo', '_blank'));

        $('#tablaDetalles').on('click', '.btn-remove-item', function() {
            const index = $(this).data('index');
            itemsVenta.splice(index, 1);
            renderizarListaDetalles();
        });

        $('#tablaDetalles').on('change', '.input-cantidad-item', function() {
            const index = $(this).data('index');
            const nuevaCantidad = parseInt($(this).val(), 10);
            const item = itemsVenta[index];
            if (!item || isNaN(nuevaCantidad) || nuevaCantidad < 1) {
                $(this).val(item ? item.cantidad : 1);
                return;
            }
            if (nuevaCantidad > item.stock) {
                Swal.fire('Stock insuficiente', `Solo hay ${item.stock} unidades disponibles`, 'warning');
                $(this).val(item.cantidad);
                return;
            }
            item.cantidad = nuevaCantidad;
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

        // Botón descargar PDF
        $('#btnDescargarPDF').on('click', function() {
            const venta = $('#verVentaModal').data('venta');
            if (venta) generarPDF(venta, false);
        });

        // Botón abrir modal de correo
        $('#btnEnviarCorreo').on('click', function() {
            const venta = $('#verVentaModal').data('venta');
            if (!venta) return;
            currentVentaForEmail = venta;
            const correo = venta.cliente && venta.cliente.email ? venta.cliente.email : null;
            $('#emailModalCorreoTexto').text(correo || 'Sin correo registrado');
            $('#emailActualizarForm').addClass('d-none');
            $('#nuevoCorreoInput').val('');
            emailModal.show();
        });

        // Botón "Sí, Enviar" → abre Gmail con el PDF adjunto codificado
        $('#btnSiEnviar').on('click', function() {
            if (!currentVentaForEmail) return;
            const correo = currentVentaForEmail.cliente && currentVentaForEmail.cliente.email
                ? currentVentaForEmail.cliente.email : '';
            if (!correo) {
                Swal.fire('Sin correo', 'El cliente no tiene correo registrado. Actualícelo primero.', 'warning');
                return;
            }
            abrirGmailConPDF(currentVentaForEmail, correo);
        });

        // Botón "Actualizar Correo"
        $('#btnActualizarCorreo').on('click', function() {
            const form = $('#emailActualizarForm');
            if (form.hasClass('d-none')) {
                form.removeClass('d-none');
                $('#nuevoCorreoInput').val(
                    currentVentaForEmail && currentVentaForEmail.cliente && currentVentaForEmail.cliente.email
                        ? currentVentaForEmail.cliente.email : ''
                );
            } else {
                form.addClass('d-none');
            }
        });

        // Cancelar edición de correo
        $('#btnCancelarActualizarCorreo').on('click', function() {
            $('#emailActualizarForm').addClass('d-none');
            $('#nuevoCorreoInput').val('');
        });

        // Guardar nuevo correo y actualizar cliente
        $('#btnGuardarNuevoCorreo').on('click', function() {
            const nuevoCorreo = $('#nuevoCorreoInput').val().trim();
            if (!nuevoCorreo || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(nuevoCorreo)) {
                Swal.fire('Error', 'Ingrese un correo válido', 'warning');
                return;
            }
            if (!currentVentaForEmail || !currentVentaForEmail.cliente) return;
            const clienteId = currentVentaForEmail.cliente.id;

            fetch(`/clientes/api/${clienteId}/email`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getCsrfHeaders() },
                body: JSON.stringify({ email: nuevoCorreo })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    currentVentaForEmail.cliente.email = nuevoCorreo;
                    $('#emailModalCorreoTexto').text(nuevoCorreo);
                    $('#emailActualizarForm').addClass('d-none');
                    Swal.fire({ icon: 'success', title: '¡Correo actualizado!', timer: 1500, showConfirmButton: false });
                    dataTable.ajax.reload(false);
                } else {
                    Swal.fire('Error', data.message || 'No se pudo actualizar el correo', 'error');
                }
            })
            .catch(() => Swal.fire('Error', 'Error de conexión', 'error'));
        });
    }

    function buscarClientePorDocumento(termino) {
        if (!termino) {
            limpiarCliente();
            return;
        }

        const doc = termino.replace(/\D/g, '');

        if (doc.length === 8 || doc.length === 11) {
            consultarClientePorDocumento(doc);
            return;
        }

        if (/^\d+$/.test(termino)) {
            Swal.fire('Documento inválido', 'Ingrese un DNI de 8 dígitos o un RUC de 11 dígitos', 'warning');
            return;
        }

        buscarClienteEnListado(termino);
    }

    function consultarClientePorDocumento(doc) {
        showLoading(true);

        fetch(`/clientes/api/buscar/${doc}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    aplicarCliente(data.data.id, data.data.nombre, data.data.dniRuc);
                    return null;
                }
                return fetch(`/clientes/api/consultar-externo/${doc}`);
            })
            .then(res => {
                if (!res) return null;
                return res.json();
            })
            .then(extData => {
                if (!extData) return;

                if (!extData.success) {
                    limpiarCliente();
                    Swal.fire('No encontrado', extData.message || 'Documento no encontrado', 'warning');
                    return;
                }

                if (extData.origen === 'registro_local') {
                    return fetch(`/clientes/api/buscar/${doc}`)
                        .then(res => res.json())
                        .then(localData => {
                            if (localData.success && localData.data) {
                                aplicarCliente(localData.data.id, localData.data.nombre, localData.data.dniRuc);
                            }
                        });
                }

                return registrarClienteDesdeConsulta(doc, extData);
            })
            .catch(() => Swal.fire('Error', 'Error al consultar el documento', 'error'))
            .finally(() => showLoading(false));
    }

    function registrarClienteDesdeConsulta(doc, datosConsulta) {
        const clienteData = {
            dniRuc: doc,
            nombre: datosConsulta.nombre,
            telefono: datosConsulta.telefono || '',
            email: datosConsulta.email || '',
            direccion: datosConsulta.direccion || ''
        };

        return fetch('/clientes/api/guardar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getCsrfHeaders()
            },
            body: JSON.stringify(clienteData)
        })
        .then(res => res.json())
        .then(saveData => {
            if (saveData.success && saveData.data) {
                aplicarCliente(saveData.data.id, saveData.data.nombre, saveData.data.dniRuc);
                Swal.fire({
                    icon: 'success',
                    title: datosConsulta.message || 'Cliente registrado',
                    timer: 1800,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', saveData.message || 'No se pudo registrar el cliente', 'error');
            }
        });
    }

    function buscarClienteEnListado(termino) {
        const terminoLower = termino.toLowerCase();
        fetch('/clientes/api/listar')
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;
                const coincidencias = data.data.filter(c =>
                    (c.nombre && c.nombre.toLowerCase().includes(terminoLower)) ||
                    (c.dniRuc && c.dniRuc.includes(termino))
                );
                if (coincidencias.length === 1) {
                    const c = coincidencias[0];
                    aplicarCliente(c.id, c.nombre, c.dniRuc);
                } else if (coincidencias.length > 1) {
                    const opciones = coincidencias.map(c => `${c.dniRuc} - ${c.nombre}`).join('<br>');
                    Swal.fire({
                        icon: 'info',
                        title: 'Varios clientes encontrados',
                        html: `Seleccione con más precisión:<br><small>${opciones}</small>`
                    });
                } else {
                    limpiarCliente();
                    Swal.fire('No encontrado', 'No existe un cliente con ese dato', 'warning');
                }
            });
    }

    function seleccionarClienteGeneral() {
        const aplicarSiExiste = (cliente) => {
            if (cliente) {
                clienteGeneralId = cliente.id;
                aplicarCliente(cliente.id, cliente.nombre, cliente.dniRuc);
            }
        };

        if (clienteGeneralId) {
            fetch(`/clientes/api/${clienteGeneralId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) aplicarCliente(data.data.id, data.data.nombre, data.data.dniRuc);
                });
            return;
        }

        showLoading(true);
        fetch('/clientes/api/listar')
            .then(res => res.json())
            .then(data => {
                if (!data.success) return;
                const general = data.data.find(c =>
                    (c.nombre && c.nombre.toLowerCase().includes('general')) ||
                    c.dniRuc === '00000000'
                );
                if (general) {
                    aplicarSiExiste(general);
                    return;
                }

                return fetch('/clientes/api/guardar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getCsrfHeaders()
                    },
                    body: JSON.stringify({
                        dniRuc: '00000000',
                        nombre: 'CLIENTE GENERAL'
                    })
                });
            })
            .then(res => {
                if (!res) return;
                return res.json();
            })
            .then(saveData => {
                if (saveData && saveData.success && saveData.data) {
                    aplicarSiExiste(saveData.data);
                } else if (saveData && !saveData.success) {
                    Swal.fire('Error', saveData.message || 'No se pudo crear el Cliente General', 'error');
                }
            })
            .catch(() => Swal.fire('Error', 'Error al obtener el Cliente General', 'error'))
            .finally(() => showLoading(false));
    }

    /**
     * Agrega un producto a la lista temporal
     */
    function agregarProductoALista() {
        const prodId = $('#selectProducto').val();
        const prodNombre = $('#selectProducto option:selected').text().split(' (')[0];
        const cantidad = parseInt($('#inputCantidad').val(), 10) || 1;
        const precio = parseFloat($('#inputPrecio').val());
        const stock = parseInt($('#selectProducto option:selected').data('stock'), 10);

        if (!prodId) return;

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
                precio: precio,
                stock: stock
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

        if (itemsVenta.length === 0) {
            tbody.append(`
                <tr class="tabla-empty">
                    <td colspan="5">
                        <i class="bi bi-basket d-block mb-1 fs-4"></i>
                        Agregue productos desde el buscador o el catálogo
                    </td>
                </tr>
            `);
            actualizarResumen(0);
            $('#infoItems').text('0 productos agregados');
            return;
        }

        itemsVenta.forEach((item, index) => {
            const subtotal = item.cantidad * item.precio;
            total += subtotal;
            tbody.append(`
                <tr>
                    <td class="text-truncate" style="max-width: 280px;" title="${item.nombre}">${item.nombre}</td>
                    <td class="text-end">S/ ${item.precio.toFixed(2)}</td>
                    <td class="text-center">
                        <input type="number" class="form-control form-control-sm input-cantidad-item"
                            value="${item.cantidad}" min="1" data-index="${index}">
                    </td>
                    <td class="text-end fw-semibold">S/ ${subtotal.toFixed(2)}</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-sm btn-danger btn-remove-item" data-index="${index}" title="Quitar">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </td>
                </tr>
            `);
        });

        actualizarResumen(total);
        $('#infoItems').text(`${itemsVenta.length} producto${itemsVenta.length === 1 ? '' : 's'} agregado${itemsVenta.length === 1 ? '' : 's'}`);
    }

    function actualizarResumen(total) {
        const totalRedondeado = Math.round(total * 100) / 100;
        const subtotal = Math.round((totalRedondeado / 1.18) * 100) / 100;
        const igv = Math.round((totalRedondeado - subtotal) * 100) / 100;

        $('#subtotalVenta').text(subtotal.toFixed(2));
        $('#igvVenta').text(igv.toFixed(2));
        $('#descuentoVenta').text('0.00');
        $('#totalVenta').text(totalRedondeado.toFixed(2));
        calcularVuelto();
    }

    function calcularVuelto() {
        const total = parseFloat($('#totalVenta').text()) || 0;
        const metodo = $('#selectMetodoPago').val();
        const $vuelto = $('#vueltoInfo');

        if (metodo !== 'efectivo') {
            $vuelto.removeClass('insuficiente ok').text('');
            actualizarEstadoCobro();
            return;
        }

        const recibido = parseFloat($('#inputEfectivoRecibido').val()) || 0;
        const vuelto = Math.round((recibido - total) * 100) / 100;

        if (total <= 0) {
            $vuelto.removeClass('ok').addClass('insuficiente').text('Vuelto: —');
        } else if (recibido < total) {
            $vuelto.removeClass('ok').addClass('insuficiente').text('Vuelto: Monto insuficiente');
        } else {
            $vuelto.removeClass('insuficiente').addClass('ok').text(`Vuelto: S/ ${vuelto.toFixed(2)}`);
        }

        actualizarEstadoCobro();
    }

    function actualizarEstadoCobro() {
        const total = parseFloat($('#totalVenta').text()) || 0;
        const tieneCliente = !!selectedClienteId;
        const tieneItems = itemsVenta.length > 0;
        const metodo = $('#selectMetodoPago').val();
        let pagoValido = true;

        if (metodo === 'efectivo' && total > 0) {
            const recibido = parseFloat($('#inputEfectivoRecibido').val()) || 0;
            pagoValido = recibido >= total;
        }

        $('#btnProcesarVenta').prop('disabled', !(tieneCliente && tieneItems && total > 0 && pagoValido));
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

        const total = parseFloat($('#totalVenta').text());
        const metodo = $('#selectMetodoPago').val();
        if (metodo === 'efectivo') {
            const recibido = parseFloat($('#inputEfectivoRecibido').val()) || 0;
            if (recibido < total) {
                Swal.fire('Pago insuficiente', 'El efectivo recibido no cubre el total', 'warning');
                return;
            }
        }

        const ventaData = {
            cliente: { id: selectedClienteId },
            total: total,
            detalles: itemsVenta.map(item => ({
                producto: { id: item.productoId },
                cantidad: item.cantidad,
                precioVenta: item.precio
            }))
        };

        const metodoLabel = $('#selectMetodoPago option:selected').text().trim();
        Swal.fire({
            title: '¿Confirmar cobro?',
            html: `
                <p class="mb-1"><strong>Cliente:</strong> ${selectedClienteNombre || '—'}</p>
                <p class="mb-1"><strong>Método:</strong> ${metodoLabel}</p>
                <p class="mb-0 fs-5 fw-bold text-warning">Total: S/ ${ventaData.total.toFixed(2)}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, cobrar',
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
                    $('#verVentaModal').data('venta', venta); // Guardar para WhatsApp, PDF y Correo
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
        // Nota: WhatsApp Web no soporta adjuntos directos por URL
        window.open(url, '_blank');
    }

    /**
     * Genera un PDF de la Nota de Venta usando jsPDF
     * @param {Object} venta - datos de la venta
     * @param {Boolean} returnBlob - si true, retorna la promesa del Blob en lugar de descargar
     */
    function generarPDF(venta, returnBlob = false) {
        // Cargar jsPDF dinámicamente si no está disponible
        function crearPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            const margen = 15;
            let y = 20;

            // Encabezado
            doc.setFillColor(13, 110, 253);
            doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('PERNOS VEGA', 105, 15, { align: 'center' });
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('Ferretería y Suministros Industriales', 105, 23, { align: 'center' });
            doc.text('Tel: +51 968 871 577', 105, 30, { align: 'center' });

            y = 50;
            doc.setTextColor(0, 0, 0);

            // Título comprobante
            const comprobante = (venta.tipoComprobante && venta.serie && venta.numeroComprobante)
                ? `${venta.tipoComprobante} ${venta.serie}-${venta.numeroComprobante}`
                : `NOTA DE VENTA #${venta.id}`;

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(comprobante, 105, y, { align: 'center' });
            y += 10;

            // Datos del cliente y fecha
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const clienteNombre = venta.cliente ? venta.cliente.nombre : 'General';
            const clienteDni   = venta.cliente ? (venta.cliente.dniRuc || '-') : '-';
            const clienteEmail = venta.cliente ? (venta.cliente.email || '-') : '-';
            const fecha = new Date(venta.fecha).toLocaleString('es-PE');
            const vendedor = venta.usuario ? venta.usuario.nombre : '-';

            doc.setFillColor(245, 245, 245);
            doc.rect(margen, y, 180, 28, 'F');
            doc.setFont('helvetica', 'bold');
            doc.text('Cliente:', margen + 3, y + 7);
            doc.text('DNI/RUC:', margen + 3, y + 13);
            doc.text('Correo:', margen + 3, y + 19);
            doc.text('Fecha:', margen + 95, y + 7);
            doc.text('Vendedor:', margen + 95, y + 13);
            doc.setFont('helvetica', 'normal');
            doc.text(clienteNombre, margen + 22, y + 7);
            doc.text(clienteDni,    margen + 22, y + 13);
            doc.text(clienteEmail,  margen + 22, y + 19);
            doc.text(fecha,         margen + 112, y + 7);
            doc.text(vendedor,      margen + 118, y + 13);
            y += 35;

            // Cabecera tabla
            doc.setFillColor(13, 110, 253);
            doc.rect(margen, y, 180, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text('Producto',       margen + 2, y + 5.5);
            doc.text('Cant.',          margen + 100, y + 5.5, { align: 'center' });
            doc.text('Precio Unit.',   margen + 130, y + 5.5, { align: 'center' });
            doc.text('Subtotal',       margen + 175, y + 5.5, { align: 'right' });
            y += 8;

            // Filas de productos
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            venta.detalles.forEach((d, i) => {
                const bgColor = i % 2 === 0 ? [255, 255, 255] : [248, 249, 250];
                doc.setFillColor(...bgColor);
                doc.rect(margen, y, 180, 7, 'F');
                const desc = d.descuento || 0;
                const sub  = d.subtotal !== null && d.subtotal !== undefined
                    ? d.subtotal : (d.cantidad * d.precioVenta - desc);
                doc.text(d.producto.nombre.substring(0, 50), margen + 2, y + 5);
                doc.text(String(d.cantidad),                  margen + 100, y + 5, { align: 'center' });
                doc.text(`S/. ${d.precioVenta.toFixed(2)}`,  margen + 130, y + 5, { align: 'center' });
                doc.text(`S/. ${sub.toFixed(2)}`,            margen + 175, y + 5, { align: 'right' });
                y += 7;
            });

            // Totales
            const subtotalVenta = venta.subtotal != null ? venta.subtotal : (venta.total / 1.18);
            const igvVenta      = venta.igv != null ? venta.igv : (venta.total - subtotalVenta);
            y += 4;
            doc.setDrawColor(220, 220, 220);
            doc.line(margen, y, margen + 180, y);
            y += 5;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Subtotal:', margen + 130, y, { align: 'right' });
            doc.text(`S/. ${subtotalVenta.toFixed(2)}`, margen + 178, y, { align: 'right' });
            y += 6;
            doc.text('IGV (18%):', margen + 130, y, { align: 'right' });
            doc.text(`S/. ${igvVenta.toFixed(2)}`, margen + 178, y, { align: 'right' });
            y += 7;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(13, 110, 253);
            doc.rect(margen + 100, y - 3, 80, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text('TOTAL:', margen + 130, y + 4, { align: 'right' });
            doc.text(`S/. ${venta.total.toFixed(2)}`, margen + 178, y + 4, { align: 'right' });

            // Pie
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.text('¡Gracias por su preferencia! — Pernos Vega', 105, 285, { align: 'center' });

            return doc;
        }

        function ejecutar() {
            const doc = crearPDF();
            const nombreArchivo = `NotaVenta_${venta.id}_${venta.serie || 'NV'}-${venta.numeroComprobante || venta.id}.pdf`;
            if (returnBlob) {
                return Promise.resolve({ blob: doc.output('blob'), nombre: nombreArchivo });
            } else {
                doc.save(nombreArchivo);
                return Promise.resolve(null);
            }
        }

        if (window.jspdf && window.jspdf.jsPDF) {
            return ejecutar();
        } else {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                script.onload = () => resolve(ejecutar());
                script.onerror = () => reject(new Error('No se pudo cargar jsPDF'));
                document.head.appendChild(script);
            }).then(p => p);
        }
    }

    /**
     * Abre Gmail con la Nota de Venta como PDF adjunto (codificado base64 en mailto)
     * Nota: mailto no soporta adjuntos, por lo que abrimos Gmail con asunto y cuerpo
     * y descargamos el PDF para que el usuario lo adjunte manualmente.
     */
    function abrirGmailConPDF(venta, correo) {
        generarPDF(venta, false); // Descarga el PDF automáticamente

        const comprobante = (venta.tipoComprobante && venta.serie && venta.numeroComprobante)
            ? `${venta.tipoComprobante} ${venta.serie}-${venta.numeroComprobante}`
            : `Nota de Venta #${venta.id}`;
        const clienteNombre = venta.cliente ? venta.cliente.nombre : 'Cliente';
        const fecha = new Date(venta.fecha).toLocaleDateString('es-PE');

        const asunto = encodeURIComponent(`${comprobante} - Pernos Vega`);
        const cuerpo = encodeURIComponent(
            `Estimado/a ${clienteNombre},\n\n` +
            `Adjuntamos su ${comprobante} del ${fecha}.\n\n` +
            `Detalle de su compra:\n` +
            venta.detalles.map(d => {
                const sub = d.subtotal != null ? d.subtotal : (d.cantidad * d.precioVenta - (d.descuento || 0));
                return `  • ${d.cantidad} x ${d.producto.nombre} — S/. ${sub.toFixed(2)}`;
            }).join('\n') +
            `\n\nTOTAL: S/. ${venta.total.toFixed(2)}` +
            `\n\nEl PDF fue descargado en su equipo. Por favor adjúntelo a este correo antes de enviarlo.` +
            `\n\nGracias por su preferencia.\nPernos Vega — +51 968 871 577`
        );

        // Abrir Gmail compose
        const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(correo)}&su=${asunto}&body=${cuerpo}`;
        window.open(gmailUrl, '_blank');

        emailModal.hide();
        Swal.fire({
            icon: 'info',
            title: 'PDF descargado',
            text: 'El PDF fue descargado automáticamente. Adjúntalo al correo de Gmail que se abrió.',
            confirmButtonText: 'Entendido'
        });
    }

    /**
     * Resetea el formulario
     */
    function resetVentaForm() {
        itemsVenta = [];
        selectedClienteId = null;
        selectedClienteNombre = null;
        $('#inputBuscarCliente').val('');
        $('#clienteActivoInfo').empty();
        $('#selectProducto').val(null).trigger('change');
        $('#inputCantidad').val(1);
        $('#inputPrecio').val('');
        $('#inputComprobante').val('NOTA DE VENTA');
        $('#selectMetodoPago').val('efectivo');
        $('#boxEfectivo').removeClass('d-none');
        $('#inputEfectivoRecibido').val('0');
        $('#vueltoInfo').removeClass('ok').addClass('insuficiente').text('Vuelto: Monto insuficiente');
        renderizarListaDetalles();
        actualizarEstadoCobro();
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
