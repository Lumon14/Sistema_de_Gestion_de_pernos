/**
 * Sistema de notificaciones in-app y escritorio (panel superior accesible)
 */
(function () {
    let ultimasIds = new Set();
    let permisoEscritorio = false;
    let panelAbierto = false;

    function solicitarPermisoEscritorio() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'granted') {
            permisoEscritorio = true;
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(p => {
                permisoEscritorio = p === 'granted';
            });
        }
    }

    function mostrarNotificacionEscritorio(notif) {
        if (!permisoEscritorio || !notif) return;
        try {
            const n = new Notification(notif.titulo, {
                body: notif.mensaje,
                icon: '/images/products/placeholder.svg',
                tag: 'pv-' + notif.id
            });
            n.onclick = function () {
                window.focus();
                if (notif.urlDestino) window.location.href = notif.urlDestino;
                n.close();
            };
        } catch (e) { /* ignore */ }
    }

    function etiquetaTipo(tipo) {
        const map = {
            PEDIDO_NUEVO: 'Pedido',
            STOCK_BAJO: 'Inventario',
            STOCK_AGOTADO: 'Inventario',
            CUENTA_COBRAR: 'Por cobrar',
            CUENTA_COBRAR_VENCIDA: 'Cobro vencido',
            CUENTA_PAGAR: 'Por pagar'
        };
        return map[tipo] || 'Alerta';
    }

    function iconoPorTipo(tipo) {
        const map = {
            PEDIDO_NUEVO: 'bi-cart-check-fill text-success',
            STOCK_BAJO: 'bi-exclamation-triangle-fill text-warning',
            STOCK_AGOTADO: 'bi-x-octagon-fill text-danger',
            CUENTA_COBRAR: 'bi-cash-coin text-primary',
            CUENTA_COBRAR_VENCIDA: 'bi-exclamation-circle-fill text-danger',
            CUENTA_PAGAR: 'bi-wallet2 text-warning'
        };
        return map[tipo] || 'bi-bell-fill text-primary';
    }

    function formatearFecha(fechaStr) {
        if (!fechaStr) return '';
        const d = new Date(fechaStr);
        const hoy = new Date();
        const ayer = new Date(hoy);
        ayer.setDate(hoy.getDate() - 1);
        if (d.toDateString() === hoy.toDateString()) {
            return 'Hoy ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        }
        if (d.toDateString() === ayer.toDateString()) {
            return 'Ayer ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleString('es-PE', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function renderLista(notificaciones) {
        const $lista = $('#notificacionesLista');
        if (!$lista.length) return;

        if (!notificaciones || notificaciones.length === 0) {
            $lista.html('<p class="notif-empty">No tiene notificaciones por ahora.</p>');
            return;
        }

        let html = '';
        notificaciones.forEach(n => {
            const noLeida = !n.leida;
            html += `
                <button type="button" class="notif-item${noLeida ? ' notif-item-unread' : ''}"
                    data-id="${n.id}" data-url="${n.urlDestino || ''}">
                    <span class="notif-item-icon"><i class="bi ${iconoPorTipo(n.tipo)}"></i></span>
                    <span class="notif-item-content">
                        <span class="notif-item-meta">
                            <strong class="notif-item-type">${etiquetaTipo(n.tipo)}</strong>
                            <span class="notif-item-time">${formatearFecha(n.fechaCreacion)}</span>
                        </span>
                        <span class="notif-item-title">${n.titulo || ''}</span>
                        <span class="notif-item-msg">${n.mensaje || ''}</span>
                    </span>
                </button>`;
        });
        $lista.html(html);
    }

    function actualizarContador(noLeidas) {
        const $badge = $('#notificacionesContador');
        if (!$badge.length) return;
        if (noLeidas > 0) {
            $badge.text(noLeidas > 99 ? '99+' : noLeidas).removeClass('d-none');
        } else {
            $badge.addClass('d-none').text('0');
        }
    }

    function abrirPanel() {
        panelAbierto = true;
        $('#notifPanel, #notifBackdrop').removeClass('d-none');
        cargarNotificaciones(false);
    }

    function cerrarPanel() {
        panelAbierto = false;
        $('#notifPanel, #notifBackdrop').addClass('d-none');
    }

    function cargarNotificaciones(esPoll) {
        fetch('/notificaciones/api/listar')
            .then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(data => {
                if (!data.success) {
                    $('#notificacionesLista').html('<p class="notif-empty text-danger">No se pudieron cargar las alertas.</p>');
                    return;
                }
                renderLista(data.data);
                actualizarContador(data.noLeidas || 0);

                if (esPoll && data.data) {
                    data.data.forEach(n => {
                        if (!n.leida && !ultimasIds.has(n.id)) {
                            ultimasIds.add(n.id);
                            if (ultimasIds.size > 100) {
                                ultimasIds = new Set([...ultimasIds].slice(-50));
                            }
                            mostrarNotificacionEscritorio(n);
                        }
                    });
                } else if (data.data) {
                    data.data.forEach(n => ultimasIds.add(n.id));
                }
            })
            .catch(() => {
                $('#notificacionesLista').html('<p class="notif-empty text-danger">Error al cargar. Verifique que la tabla notificaciones exista en la BD.</p>');
            });
    }

    function marcarLeida(id, url) {
        fetch('/notificaciones/api/' + id + '/leida', {
            method: 'PUT',
            headers: getCsrfHeaders()
        }).then(() => {
            if (url) {
                window.location.href = url;
            } else {
                cargarNotificaciones(false);
            }
        });
    }

    let initialized = false;

    window.initNotificaciones = function () {
        if (initialized || !document.getElementById('btnNotificaciones')) return;
        initialized = true;

        solicitarPermisoEscritorio();
        cargarNotificaciones(false);

        $('#btnNotificaciones').on('click', function (e) {
            e.stopPropagation();
            if (panelAbierto) cerrarPanel();
            else abrirPanel();
        });

        $('#btnCerrarNotifPanel, #notifBackdrop').on('click', cerrarPanel);

        $(document).on('click', '.notif-item', function () {
            marcarLeida($(this).data('id'), $(this).data('url'));
        });

        $('#btnMarcarTodasLeidas').on('click', function (e) {
            e.preventDefault();
            fetch('/notificaciones/api/leer-todas', {
                method: 'PUT',
                headers: getCsrfHeaders()
            }).then(() => cargarNotificaciones(false));
        });

        $(document).on('keydown', function (e) {
            if (e.key === 'Escape' && panelAbierto) cerrarPanel();
        });

        setInterval(() => cargarNotificaciones(true), 30000);
    };
})();
