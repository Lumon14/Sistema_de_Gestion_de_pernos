/**
 * Script para la gestión de ventas y notas de venta
 * Archivo: src/main/resources/static/js/ventas.js
 * Requiere: jsPDF (cargado dinámicamente si no existe)
 */

$(document).ready(function() {
    $.fn.dataTable.ext.errMode = 'none';

    const CONFIG = window.VENTAS_CONFIG || {
        tipoVista: 'notas',
        apiListar: '/ventas/api/listar',
        apiGuardar: '/ventas/api/guardar',
        permitirCrear: true,
        permitirCanje: false
    };

    // Variables globales
    let dataTable;
    let itemsVenta = [];
    let ventaModal;
    let verVentaModal;
    let emailModal;
    let selectedClienteId = null;
    let selectedClienteNombre = null;
    let clienteGeneralId = null;
    let currentVentaForEmail = null;
    let pagosAgregados = [];

    initializeDataTable();
    if (document.getElementById('ventaModal')) {
        ventaModal = new bootstrap.Modal(document.getElementById('ventaModal'));
    }
    if (document.getElementById('verVentaModal')) {
        verVentaModal = new bootstrap.Modal(document.getElementById('verVentaModal'));
    }
    if (document.getElementById('emailModal')) {
        emailModal = new bootstrap.Modal(document.getElementById('emailModal'));
    }

    if (!CONFIG.permitirCrear) {
        $('#btnNuevaVenta').hide();
    }
    
    // Inicializar Select2 (solo en vista notas)
    if ($('.select2-producto').length) {
        $('.select2-producto').select2({
            theme: 'bootstrap-5',
            dropdownParent: $('#ventaModal'),
            placeholder: 'Buscar familia, modelo o código...',
            allowClear: true
        });
    }

    if (CONFIG.permitirCrear) {
        cargarClienteGeneral();
    }

    // Event Listeners
    setupEventListeners();

    /**
     * Inicializa DataTable para listar ventas
     */
    function initializeDataTable() {
        dataTable = $('#tablaVentas').DataTable({
            responsive: true,
            ajax: {
                url: CONFIG.apiListar,
                dataSrc: 'data',
                error: function() {
                    Swal.fire('Error', 'No se pudieron cargar los comprobantes. Reinicie la aplicación e intente de nuevo.', 'error');
                }
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
                    data: 'estadoDocumento',
                    render: (data, type, row) => {
                        if (row.estado === 0) {
                            return '<span class="badge bg-danger">Anulada</span>';
                        }
                        const map = {
                            PENDIENTE: '<span class="badge bg-warning text-dark">Pendiente</span>',
                            CANJEADA: '<span class="badge bg-info text-dark">Canjeada</span>',
                            EMITIDA: '<span class="badge bg-success">Emitida</span>',
                            ANULADA: '<span class="badge bg-danger">Anulada</span>'
                        };
                        return map[data] || '<span class="badge bg-success">Procesada</span>';
                    }
                },
                {
                    data: null,
                    className: 'text-center',
                    render: (data, type, row) => {
                        let html = `<div class="d-flex gap-1 justify-content-center">
                            <button class="btn-action btn-view action-view" data-id="${row.id}" title="Ver Detalle">
                                <i class="bi bi-eye-fill"></i>
                            </button>`;
                        if (CONFIG.tipoVista === 'notas' && row.estadoDocumento === 'PENDIENTE' && row.estado === 1) {
                            html += `<button class="btn-action btn-edit action-edit" data-id="${row.id}" title="Editar Nota">
                                <i class="bi bi-pencil-fill"></i>
                            </button>`;
                        }
                        if (row.estado === 1) {
                            html += `<button class="btn-action btn-delete action-cancel" data-id="${row.id}" title="Anular">
                                <i class="bi bi-x-circle-fill"></i>
                            </button>`;
                        }
                        html += `</div>`;
                        return html;
                    }
                }
            ],
            dom: 'rtip',
            language: { url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json" }
        });

        setupTableSearch('#buscadorVentas', dataTable);
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
                CONFIG.tipoVista === 'notas' ? 'NOTA DE VENTA' : (dniRuc.length === 11 ? 'FACTURA' : 'NOTA DE VENTA')
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
        if ($('#btnNuevaVenta').length) {
            $('#btnNuevaVenta').on('click', () => {
                resetVentaForm();
                ventaModal.show();
            });
        }

        if ($('#inputBuscarCliente').length) {
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
        }

        if ($('#btnAgregarPagoLista').length) {
            $('#btnAgregarPagoLista').on('click', agregarPagoALista);
            $('#inputMontoPagoLista').on('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    agregarPagoALista();
                }
            });
            $('#tbodyPagosListado').on('click', '.btn-remove-pago', function() {
                const idx = $(this).data('index');
                eliminarPagoDeLista(idx);
            });
            $('#inputEfectivoRecibido').on('input', calcularVuelto);
        }

        if ($('#selectProducto').length) {
            $('#selectProducto').on('change', function() {
                const precio = $(this).find(':selected').data('precio');
                $('#inputPrecio').val(precio ? parseFloat(precio).toFixed(2) : '');
                if ($(this).val()) {
                    agregarProductoALista();
                }
            });
        }

        if ($('#btnVerCatalogo').length) {
            $('#btnVerCatalogo').on('click', () => window.open('/catalogo', '_blank'));
        }

        if ($('#tablaDetalles').length) {
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
        }

        if ($('#btnProcesarVenta').length) {
            $('#btnProcesarVenta').on('click', procesarVenta);
        }

        $('#tablaVentas tbody').on('click', '.action-view', function() {
            const id = $(this).data('id');
            verDetalleVenta(id);
        });

        $('#tablaVentas tbody').on('click', '.action-cancel', function() {
            const id = $(this).data('id');
            confirmarCancelacion(id);
        });

        $('#tablaVentas tbody').on('click', '.action-edit', function() {
            const id = $(this).data('id');
            abrirEditarNotaVenta(id);
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
            const etiqueta = obtenerEtiquetaComprobante(venta);
            $('#emailModalLabel').html(`<i class="bi bi-envelope-fill me-2"></i>Enviar ${etiqueta}`);
            $('#emailModalPregunta').text(`¿Desea enviar la ${etiqueta} a este correo?`);
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

    function esComprobanteConIgv(venta) {
        return venta && venta.tipoComprobante === 'FACTURA';
    }

    function obtenerEtiquetaComprobante(venta) {
        if (!venta || !venta.tipoComprobante) return 'Nota de Venta';
        const map = {
            NOTA: 'Nota de Venta',
            BOLETA: 'Boleta',
            FACTURA: 'Factura'
        };
        return map[venta.tipoComprobante] || venta.tipoComprobante;
    }

    function actualizarResumen(total) {
        const totalRedondeado = Math.round(total * 100) / 100;
        $('#subtotalVenta').text(totalRedondeado.toFixed(2));
        $('#igvVenta').text('0.00');
        $('#descuentoVenta').text('0.00');
        $('#totalVenta').text(totalRedondeado.toFixed(2));
        $('#resumenTotalVenta').text(`S/ ${totalRedondeado.toFixed(2)}`);

        // Si solo hay un pago en la lista, lo actualizamos al total automáticamente
        if (pagosAgregados.length === 1) {
            pagosAgregados[0].monto = totalRedondeado;
        }

        actualizarDistribucionPagos();
    }

    function agregarPagoALista() {
        const metodo = $('#inputMetodoPagoLista').val();
        const monto = parseFloat($('#inputMontoPagoLista').val()) || 0;

        if (monto <= 0) {
            Swal.fire('Atención', 'Ingrese un monto mayor a cero', 'warning');
            return;
        }

        const montoRedondeado = Math.round(monto * 100) / 100;

        // Si ya existe el método en la lista, le sumamos el monto
        const existeIndex = pagosAgregados.findIndex(p => p.metodo === metodo);
        if (existeIndex !== -1) {
            pagosAgregados[existeIndex].monto = Math.round((pagosAgregados[existeIndex].monto + montoRedondeado) * 100) / 100;
        } else {
            pagosAgregados.push({ metodo: metodo, monto: montoRedondeado });
        }

        actualizarDistribucionPagos();
    }

    function eliminarPagoDeLista(index) {
        pagosAgregados.splice(index, 1);
        actualizarDistribucionPagos();
    }

    function actualizarDistribucionPagos() {
        const total = parseFloat($('#totalVenta').text()) || 0;
        const $tbody = $('#tbodyPagosListado');
        $tbody.empty();

        let sum = 0;
        let tieneEfectivo = false;
        let montoEfectivo = 0;

        pagosAgregados.forEach((pago, index) => {
            sum += pago.monto;
            if (pago.metodo === 'EFECTIVO') {
                tieneEfectivo = true;
                montoEfectivo += pago.monto;
            }

            const row = `
                <tr>
                    <td class="py-1 fw-semibold">${pago.metodo}</td>
                    <td class="text-end py-1 fw-bold">S/ ${pago.monto.toFixed(2)}</td>
                    <td class="text-center py-1">
                        <button type="button" class="btn btn-link text-danger p-0 btn-remove-pago" data-index="${index}" style="line-height:1; border:none; background:none;">
                            <i class="bi bi-trash fs-6"></i>
                        </button>
                    </td>
                </tr>
            `;
            $tbody.append(row);
        });

        sum = Math.round(sum * 100) / 100;
        $('#resumenTotalAgregado').text(`S/ ${sum.toFixed(2)}`);

        const diff = Math.round((total - sum) * 100) / 100;
        const $restanteLabel = $('#resumenRestante');
        $restanteLabel.text(`S/ ${diff.toFixed(2)}`);

        if (Math.abs(diff) < 0.01) {
            $restanteLabel.removeClass('text-danger text-warning').addClass('text-success');
        } else if (diff > 0) {
            $restanteLabel.removeClass('text-success text-warning').addClass('text-danger');
        } else {
            $restanteLabel.removeClass('text-success text-danger').addClass('text-warning');
        }

        // Sugerir el restante en el input de monto para agilizar la entrada
        if (diff > 0) {
            $('#inputMontoPagoLista').val(diff.toFixed(2));
        } else {
            $('#inputMontoPagoLista').val('');
        }

        const $alerta = $('#alertaMontoMixto');
        if (Math.abs(diff) < 0.01) {
            $alerta.html('<span class="text-success fw-bold"><i class="bi bi-check-circle-fill"></i> Distribución correcta</span>');
        } else if (diff > 0) {
            $alerta.html(`<span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Falta distribuir S/ ${diff.toFixed(2)}</span>`);
        } else {
            $alerta.html(`<span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill"></i> Exceso de S/ ${Math.abs(diff).toFixed(2)}</span>`);
        }

        // Mostrar boxEfectivo si hay efectivo en la lista de pagos
        $('#boxEfectivo').toggleClass('d-none', !tieneEfectivo);

        calcularVuelto();
    }

    function calcularVuelto() {
        const $vuelto = $('#vueltoInfo');
        
        // Buscamos si hay un pago de tipo EFECTIVO
        const pagoEf = pagosAgregados.find(p => p.metodo === 'EFECTIVO');
        const targetCashAmount = pagoEf ? pagoEf.monto : 0;

        if (targetCashAmount <= 0) {
            $vuelto.removeClass('insuficiente ok').text('');
            actualizarEstadoCobro();
            return;
        }

        const recibido = parseFloat($('#inputEfectivoRecibido').val()) || 0;
        const vuelto = Math.round((recibido - targetCashAmount) * 100) / 100;

        if (recibido < targetCashAmount) {
            $vuelto.removeClass('ok').addClass('insuficiente').text('Vuelto: Monto insuficiente');
        } else {
            $vuelto.removeClass('insuficiente').addClass('ok').text(`VUELTO: S/ ${vuelto.toFixed(2)}`);
        }

        actualizarEstadoCobro();
    }

    function actualizarEstadoCobro() {
        const total = parseFloat($('#totalVenta').text()) || 0;
        const tieneCliente = !!selectedClienteId;
        const tieneItems = itemsVenta.length > 0;
        
        // Sumar todos los pagos agregados
        let sum = 0;
        let ef = 0;
        pagosAgregados.forEach(p => {
            sum += p.monto;
            if (p.metodo === 'EFECTIVO') {
                ef += p.monto;
            }
        });
        
        sum = Math.round(sum * 100) / 100;
        const distribucionExacta = Math.abs(total - sum) < 0.01;

        let vueltoValido = true;
        if (ef > 0) {
            const recibido = parseFloat($('#inputEfectivoRecibido').val()) || 0;
            vueltoValido = recibido >= ef;
        }

        const pagoValido = distribucionExacta && vueltoValido && pagosAgregados.length > 0;

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
        
        let ef = 0;
        let yp = 0;
        let tr = 0;
        let tj = 0;

        pagosAgregados.forEach(p => {
            if (p.metodo === 'EFECTIVO') ef += p.monto;
            if (p.metodo === 'YAPE') yp += p.monto;
            if (p.metodo === 'TRANSFERENCIA') tr += p.monto;
            if (p.metodo === 'TARJETA') tj += p.monto;
        });

        const sum = Math.round((ef + yp + tr + tj) * 100) / 100;
        if (Math.abs(total - sum) >= 0.01) {
            Swal.fire('Distribución incorrecta', 'La suma de los métodos de pago no coincide con el total de la venta', 'warning');
            return;
        }
        if (ef > 0) {
            const recibido = parseFloat($('#inputEfectivoRecibido').val()) || 0;
            if (recibido < ef) {
                Swal.fire('Pago insuficiente', 'El efectivo recibido no cubre la parte en efectivo', 'warning');
                return;
            }
        }

        const editId = $('#editVentaId').val();
        
        // Determinar método de pago principal o MIXTO
        let metodoPagoFinal = 'EFECTIVO';
        const metodosDistintos = pagosAgregados.filter(p => p.monto > 0);
        if (metodosDistintos.length > 1) {
            metodoPagoFinal = 'MIXTO';
        } else if (metodosDistintos.length === 1) {
            metodoPagoFinal = metodosDistintos[0].metodo;
        }

        const ventaData = {
            cliente: { id: selectedClienteId },
            total: total,
            metodoPago: metodoPagoFinal,
            montoEfectivo: ef,
            montoTransferencia: tr,
            montoYape: yp,
            montoTarjeta: tj,
            detalles: itemsVenta.map(item => ({
                producto: { id: item.productoId },
                cantidad: item.cantidad,
                precioVenta: item.precio
            }))
        };

        const apiEndpoint = editId ? `/ventas/api/notas/${editId}/editar` : CONFIG.apiGuardar;
        const confirmTitle = editId ? '¿Guardar cambios?' : '¿Confirmar cobro?';
        const confirmBtnText = editId ? 'Sí, guardar' : 'Sí, cobrar';

        let metodoLabel = '';
        if (metodoPagoFinal === 'MIXTO') {
            const details = [];
            if (ef > 0) details.push(`Efectivo: S/ ${ef.toFixed(2)}`);
            if (yp > 0) details.push(`Yape: S/ ${yp.toFixed(2)}`);
            if (tr > 0) details.push(`Transf.: S/ ${tr.toFixed(2)}`);
            if (tj > 0) details.push(`Tarjeta: S/ ${tj.toFixed(2)}`);
            metodoLabel = `Pago Mixto (${details.join(', ')})`;
        } else {
            metodoLabel = metodoPagoFinal;
        }

        Swal.fire({
            title: confirmTitle,
            html: `
                <p class="mb-1"><strong>Cliente:</strong> ${selectedClienteNombre || '—'}</p>
                <p class="mb-1"><strong>Método:</strong> ${metodoLabel}</p>
                <p class="mb-0 fs-5 fw-bold text-warning">Total: S/ ${ventaData.total.toFixed(2)}</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: confirmBtnText,
            cancelButtonText: 'Revisar'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);
                fetch(apiEndpoint, {
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
                        Swal.fire('¡Éxito!', editId ? 'Nota actualizada correctamente' : 'Venta registrada correctamente', 'success');
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

                    const clienteDni = venta.cliente && venta.cliente.dniRuc && venta.cliente.dniRuc !== '00000000'
                        ? venta.cliente.dniRuc
                        : (venta.cliente && venta.cliente.dniRuc ? venta.cliente.dniRuc : '-');

                    // Detalle del método de pago
                    let metodoPagoInfo = '';
                    if (venta.metodoPago === 'MIXTO') {
                        const parts = [];
                        if (venta.montoEfectivo > 0) parts.push(`Efectivo: S/ ${venta.montoEfectivo.toFixed(2)}`);
                        if (venta.montoYape > 0) parts.push(`Yape: S/ ${venta.montoYape.toFixed(2)}`);
                        if (venta.montoTransferencia > 0) parts.push(`Transf.: S/ ${venta.montoTransferencia.toFixed(2)}`);
                        if (venta.montoTarjeta > 0) parts.push(`Tarjeta: S/ ${venta.montoTarjeta.toFixed(2)}`);
                        metodoPagoInfo = `<p class="mb-1"><strong>Método de Pago:</strong> <span class="text-primary fw-semibold">MIXTO (${parts.join(', ')})</span></p>`;
                    } else {
                        metodoPagoInfo = `<p class="mb-1"><strong>Método de Pago:</strong> <span class="text-dark fw-semibold">${venta.metodoPago || 'EFECTIVO'}</span></p>`;
                    }

                    let html = `
                        <div class="mb-3">
                            <p class="mb-1"><strong>Cliente:</strong> ${venta.cliente ? venta.cliente.nombre : 'General'}</p>
                            <p class="mb-1"><strong>DNI/RUC:</strong> ${clienteDni}</p>
                            ${comprobanteInfo}
                            ${metodoPagoInfo}
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

                    const mostrarIgv = esComprobanteConIgv(venta);
                    const subtotalVenta = mostrarIgv
                        ? (venta.subtotal != null ? venta.subtotal : venta.total / 1.18)
                        : venta.total;
                    const igvVenta = mostrarIgv
                        ? (venta.igv != null ? venta.igv : venta.total - subtotalVenta)
                        : 0;

                    html += `</tbody><tfoot>`;
                    if (mostrarIgv) {
                        html += `
                                <tr>
                                    <th colspan="4" class="text-end text-muted small py-1">Subtotal</th>
                                    <th class="text-end text-muted small py-1">S/. ${subtotalVenta.toFixed(2)}</th>
                                </tr>
                                <tr>
                                    <th colspan="4" class="text-end text-muted small py-1">IGV (18%)</th>
                                    <th class="text-end text-muted small py-1">S/. ${igvVenta.toFixed(2)}</th>
                                </tr>`;
                    }
                    html += `
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

        mensaje += `--------------------------%0A`;
        if (esComprobanteConIgv(venta)) {
            const subtotalVenta = venta.subtotal != null ? venta.subtotal : venta.total / 1.18;
            const igvVenta = venta.igv != null ? venta.igv : venta.total - subtotalVenta;
            mensaje += `*Subtotal:* S/. ${subtotalVenta.toFixed(2)}%0A`;
            mensaje += `*IGV (18%):* S/. ${igvVenta.toFixed(2)}%0A`;
        }
        mensaje += `*TOTAL A PAGAR: S/. ${venta.total.toFixed(2)}*%0A`;
        mensaje += `%0A¡Gracias por su preferencia!`;

        let numeroWa = '51968871577';
        if (venta.cliente && venta.cliente.telefono) {
            const tel = venta.cliente.telefono.replace(/\D/g, '');
            if (tel.length >= 9) {
                numeroWa = tel.startsWith('51') ? tel : '51' + tel;
            }
        }
        window.open(`https://wa.me/${numeroWa}?text=${mensaje}`, '_blank');
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
            const pageW = 210;
            const margen = 18;
            const contentW = pageW - margen * 2;
            const mostrarIgv = esComprobanteConIgv(venta);
            const colorPrimary = [30, 58, 95];
            const colorAccent = [14, 165, 233];
            const colorMuted = [100, 116, 139];
            let y = 0;

            // Encabezado
            doc.setFillColor(...colorPrimary);
            doc.rect(0, 0, pageW, 34, 'F');
            doc.setFillColor(...colorAccent);
            doc.rect(0, 34, pageW, 1.5, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(20);
            doc.text('PERNOS VEGA', margen, 13);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('Ferretería y Suministros Industriales', margen, 20);
            doc.setFontSize(8);
            doc.text('Tel: +51 968 871 577', margen, 26);

            const comprobante = (venta.tipoComprobante && venta.serie && venta.numeroComprobante)
                ? `${venta.tipoComprobante} ${venta.serie}-${String(venta.numeroComprobante).padStart(8, '0')}`
                : `NOTA DE VENTA #${venta.id}`;

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(comprobante, pageW - margen, 13, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            const fecha = new Date(venta.fecha).toLocaleString('es-PE');
            doc.text(fecha, pageW - margen, 20, { align: 'right' });

            y = 44;
            doc.setTextColor(30, 41, 59);

            // Datos cliente / vendedor
            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.rect(margen, y, contentW, 28, 'FD');

            const clienteNombre = venta.cliente ? venta.cliente.nombre : 'Cliente General';
            const clienteDni = venta.cliente ? (venta.cliente.dniRuc || '-') : '-';
            const clienteEmail = venta.cliente ? (venta.cliente.email || '-') : '-';
            const vendedor = venta.usuario ? venta.usuario.nombre : '-';

            doc.setFontSize(8);
            doc.setTextColor(...colorMuted);
            doc.text('CLIENTE', margen + 4, y + 7);
            doc.text('DOCUMENTO', margen + 4, y + 15);
            doc.text('CORREO', margen + 4, y + 23);
            doc.text('VENDEDOR', margen + 100, y + 7);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(30, 41, 59);
            doc.text(clienteNombre.substring(0, 45), margen + 4, y + 11);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(clienteDni, margen + 4, y + 19);
            doc.text(clienteEmail.substring(0, 40), margen + 4, y + 27);
            doc.text(vendedor, margen + 100, y + 11);

            y += 36;

            // Tabla productos
            const colProd = margen + 2;
            const colCant = margen + 118;
            const colPrecio = margen + 138;
            const colSub = margen + contentW - 2;
            const rowH = 8;

            doc.setFillColor(...colorPrimary);
            doc.rect(margen, y, contentW, rowH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.text('PRODUCTO', colProd, y + 5.5);
            doc.text('CANT.', colCant, y + 5.5, { align: 'center' });
            doc.text('P. UNIT.', colPrecio, y + 5.5, { align: 'center' });
            doc.text('SUBTOTAL', colSub, y + 5.5, { align: 'right' });
            y += rowH;

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
            venta.detalles.forEach((d, i) => {
                if (i % 2 === 1) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(margen, y, contentW, rowH, 'F');
                }
                const desc = d.descuento || 0;
                const sub = d.subtotal != null ? d.subtotal : (d.cantidad * d.precioVenta - desc);
                const nombre = d.producto.nombre.length > 52 ? d.producto.nombre.substring(0, 49) + '...' : d.producto.nombre;
                doc.text(nombre, colProd, y + 5.5);
                doc.text(String(d.cantidad), colCant, y + 5.5, { align: 'center' });
                doc.text(`S/. ${d.precioVenta.toFixed(2)}`, colPrecio, y + 5.5, { align: 'center' });
                doc.text(`S/. ${sub.toFixed(2)}`, colSub, y + 5.5, { align: 'right' });
                y += rowH;
            });

            doc.setDrawColor(226, 232, 240);
            doc.line(margen, y, margen + contentW, y);
            y += 6;

            // Totales
            const totalsX = margen + contentW - 78;
            const totalsW = 78;
            const labelX = totalsX + 4;
            const valueX = totalsX + totalsW - 4;

            if (mostrarIgv) {
                const subtotalVenta = venta.subtotal != null ? venta.subtotal : venta.total / 1.18;
                const igvVenta = venta.igv != null ? venta.igv : venta.total - subtotalVenta;
                doc.setFontSize(9);
                doc.setTextColor(...colorMuted);
                doc.text('Subtotal', labelX, y);
                doc.setTextColor(51, 65, 85);
                doc.text(`S/. ${subtotalVenta.toFixed(2)}`, valueX, y, { align: 'right' });
                y += 6;
                doc.setTextColor(...colorMuted);
                doc.text('IGV (18%)', labelX, y);
                doc.setTextColor(51, 65, 85);
                doc.text(`S/. ${igvVenta.toFixed(2)}`, valueX, y, { align: 'right' });
                y += 8;
            } else {
                y += 2;
            }

            doc.setFillColor(...colorPrimary);
            doc.rect(totalsX, y - 4, totalsW, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text('TOTAL', labelX, y + 3.5);
            doc.text(`S/. ${venta.total.toFixed(2)}`, valueX, y + 3.5, { align: 'right' });

            // Pie de página
            const footerY = 278;
            doc.setDrawColor(...colorAccent);
            doc.setLineWidth(0.4);
            doc.line(margen, footerY, margen + contentW, footerY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...colorMuted);
            doc.text('¡Gracias por su preferencia!', pageW / 2, footerY + 6, { align: 'center' });
            doc.text('PERNOS VEGA — Ferretería y Suministros Industriales', pageW / 2, footerY + 11, { align: 'center' });

            return doc;
        }

        function ejecutar() {
            const doc = crearPDF();
            const tipo = venta.tipoComprobante ? venta.tipoComprobante.replace(/\s+/g, '_') : 'NotaVenta';
            const num = venta.numeroComprobante || venta.id;
            const serie = venta.serie || 'NV';
            const nombreArchivo = `${tipo}_${serie}-${num}.pdf`;
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
        pagosAgregados = [{ metodo: 'EFECTIVO', monto: 0 }];
        $('#editVentaId').val('');
        $('#modalTitle').html('<i class="bi bi-receipt-cutoff"></i> Nueva Nota de Venta');
        $('#btnProcesarVenta').html('<i class="bi bi-check2-circle me-1"></i> Registrar Venta');
        $('#inputBuscarCliente').val('');
        $('#clienteActivoInfo').empty();
        $('#selectProducto').val(null).trigger('change');
        $('#inputCantidad').val(1);
        $('#inputPrecio').val('');
        $('#inputComprobante').val('NOTA DE VENTA');
        
        $('#inputMetodoPagoLista').val('EFECTIVO');
        $('#inputMontoPagoLista').val('');
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

    function abrirEditarNotaVenta(id) {
        showLoading(true);
        fetch(`/ventas/api/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    resetVentaForm();
                    const venta = data.data;
                    $('#editVentaId').val(venta.id);
                    $('#modalTitle').html('<i class="bi bi-pencil-square"></i> Editar Nota de Venta #' + venta.id);
                    $('#btnProcesarVenta').html('<i class="bi bi-save me-1"></i> Guardar Cambios');
                    
                    if (venta.cliente) {
                        selectedClienteId = venta.cliente.id;
                        selectedClienteNombre = venta.cliente.nombre;
                        $('#inputBuscarCliente').val(venta.cliente.dniRuc || '');
                        $('#clienteActivoInfo').html(`<i class="bi bi-check-circle-fill text-success"></i> ${venta.cliente.nombre} (${venta.cliente.dniRuc || 'Sin doc.'})`);
                    }
                    
                    itemsVenta = venta.detalles.map(d => ({
                        productoId: d.producto.id,
                        nombre: d.producto.nombre,
                        cantidad: d.cantidad,
                        precio: d.precioVenta,
                        stock: d.producto.stock + d.cantidad
                    }));

                    pagosAgregados = [];
                    if (venta.montoEfectivo > 0) pagosAgregados.push({ metodo: 'EFECTIVO', monto: venta.montoEfectivo });
                    if (venta.montoYape > 0) pagosAgregados.push({ metodo: 'YAPE', monto: venta.montoYape });
                    if (venta.montoTransferencia > 0) pagosAgregados.push({ metodo: 'TRANSFERENCIA', monto: venta.montoTransferencia });
                    if (venta.montoTarjeta > 0) pagosAgregados.push({ metodo: 'TARJETA', monto: venta.montoTarjeta });

                    if (pagosAgregados.length === 0) {
                        const fallbackMetodo = venta.metodoPago || 'EFECTIVO';
                        pagosAgregados.push({ metodo: fallbackMetodo, monto: venta.total });
                    }
                    
                    renderizarListaDetalles();
                    ventaModal.show();
                }
            })
            .finally(() => showLoading(false));
    }
});
