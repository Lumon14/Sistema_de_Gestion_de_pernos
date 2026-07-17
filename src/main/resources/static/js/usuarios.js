
$(document).ready(function() {
    // Variables globales
    let dataTable;
    let isEditing = false;
    let usuarioModal;

    // Configuración inicial
    const API_BASE = '/usuarios/api';
    const ENDPOINTS = {
        list: `${API_BASE}/listar`,
        save: `${API_BASE}/guardar`,
        get: (id) => `${API_BASE}/${id}`,
        delete: (id) => `${API_BASE}/eliminar/${id}`,
        profiles: `${API_BASE}/perfiles`,
        toggleStatus: (id) => `${API_BASE}/cambiar-estado/${id}`,
    };

    // Inicializar DataTable
    initializeDataTable(); 

    // Inicializar Modal de Bootstrap
    usuarioModal = new bootstrap.Modal(document.getElementById('usuarioModal'));

    // Cargar perfiles para el select
    loadProfiles();

    // Event Listeners
    setupEventListeners();
    setupSoloLetrasInputs();

    /**
     * Inicializa DataTable con configuración completa
     */
    function initializeDataTable() {
        dataTable = $('#tablaUsuarios').DataTable({
            responsive: true,
            processing: true,
            ajax: {
                url: ENDPOINTS.list,
                dataSrc: 'data' 
                        },
            columns: [
                { data: 'id' },
                { data: 'nombre' },
                { data: 'usuario' },
                { data: 'perfil.nombre' }, // Nueva columna para el perfil
                { data: 'correo' },
                {
                    data: 'estado',
                    render: function(data, type, row) {
                        return data === 1
                            ? '<span class="badge text-bg-success">Activo</span>' // estado 1
                            : '<span class="badge text-bg-danger">Inactivo</span>';
                    }
                },
                {
                    data: null,
                    orderable: false,
                    searchable: false,
                    render: function(data, type, row) {
                        return createActionButtons(row);
                    }
                }
            ],
            columnDefs: [
                { responsivePriority: 1, targets: 1 }, // Nombre
                { responsivePriority: 2, targets: 6 }, // Acciones
            ],
            language: {
                url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json",
            },
            dom: 'rtip',
            pageLength: 10
        });

        setupTableSearch('#buscadorUsuarios', dataTable);
    }

    /**
     * Crea los botones de acción para cada fila de la tabla
     */
    function createActionButtons(row) {
        const statusIcon = row.estado === 1 ? 'bi-slash-circle-fill' : 'bi-check-circle-fill';
        const statusTitle = row.estado === 1 ? 'Desactivar' : 'Activar';

        return `
            <div class="d-flex gap-1 justify-content-center">
                <button data-id="${row.id}" class="btn-action btn-edit action-edit" title="Editar">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button data-id="${row.id}" class="btn-action btn-status action-status" title="${statusTitle}">
                    <i class="bi ${statusIcon}"></i>
                </button>
                <button data-id="${row.id}" class="btn-action btn-delete action-delete" title="Eliminar">
                    <i class="bi bi-trash3-fill"></i>
                </button>
            </div>
        `;
    }

    const REGEX_NOMBRE = /^[\p{L}\s]+$/u;
    const REGEX_USUARIO = /^[a-zA-Z]+$/;
    const MSG_NOMBRE_INVALIDO = 'Solo se permiten letras y espacios';
    const MSG_USUARIO_INVALIDO = 'Solo se permiten letras mayúsculas y minúsculas';

    /**
     * Muestra aviso si el campo contiene caracteres no permitidos (sin bloquear la escritura)
     */
    function setupSoloLetrasInputs() {
        $('#nombre').on('input', function() {
            if (this.value && !REGEX_NOMBRE.test(this.value)) {
                showFieldError('nombre', MSG_NOMBRE_INVALIDO);
            } else {
                $('#nombre').removeClass('is-invalid');
                $('#nombre-error').text('');
            }
        });

        $('#usuario').on('input', function() {
            if (this.value && !REGEX_USUARIO.test(this.value)) {
                showFieldError('usuario', MSG_USUARIO_INVALIDO);
            } else {
                $('#usuario').removeClass('is-invalid');
                $('#usuario-error').text('');
            }
        });
    }

    /**
     * Configura todos los event listeners
     */
    function setupEventListeners() {
        // Botón nuevo registro
        $('#btnNuevoRegistro').on('click', openModalForNew);

        // Submit form
        $('#formUsuario').on('submit', function(e) {
            e.preventDefault();
            saveUsuario();
        });

        // Eventos de la tabla (delegados)
        $('#tablaUsuarios tbody').on('click', '.action-edit', handleEdit);
        $('#tablaUsuarios tbody').on('click', '.action-status', handleToggleStatus);
        $('#tablaUsuarios tbody').on('click', '.action-delete', handleDelete);
    }

    /**
     * Carga la lista de usuarios desde el backend y redibuja la tabla
     */
    function loadUsuarios() {
        dataTable.ajax.reload();
    }

    /**
     * Carga los perfiles en el select del modal
     */
    function loadProfiles() {
        fetch(ENDPOINTS.profiles)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const select = $('#id_perfil');
                    select.empty().append('<option value="">Seleccione un perfil...</option>');
                    data.data.forEach(profile => {
                        select.append(`<option value="${profile.id}">${profile.nombre}</option>`);
                    });
                } else {
                    showNotification('Error al cargar perfiles', 'error');
                }
            }).catch(error => {
                console.error('Error cargando perfiles:', error);
            });
    }

    /**
     * Guarda un usuario (crear o actualizar)
     */
    function saveUsuario() {
        clearFieldErrors();

        const formData = {
            id: $('#id').val() || null,
            nombre: $('#nombre').val().trim(),
            usuario: $('#usuario').val().trim(),
            clave: $('#clave').val(),
            correo: $('#correo').val().trim(),
            perfil: {
                id: $('#id_perfil').val()
            }
        };

        // Validación básica del lado cliente
        if (!validateForm(formData)) {
            return;
        }

        // Si es edición y la clave está vacía, no enviarla
        if (isEditing && !formData.clave) {
            delete formData.clave;
        }

        showLoading(true);

        fetch(ENDPOINTS.save, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getCsrfHeaders()
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                hideModal();
                showNotification(data.message, 'success');
                loadUsuarios(); // Recargar la tabla
            } else {
                if (data.errors) {
                    Object.keys(data.errors).forEach(field => {
                        showFieldError(field, data.errors[field]);
                    });
                } else if (data.message) {
                    const mensajeDuplicado = obtenerMensajeDuplicado(data.message);
                    if (mensajeDuplicado) {
                        showFieldError(mensajeDuplicado.campo, mensajeDuplicado.mensaje);
                    } else {
                        const campo = detectarCampoError(data.message);
                        if (campo) {
                            showFieldError(campo, data.message);
                        } else {
                            showNotification(data.message, 'error');
                        }
                    }
                } else {
                    showNotification('Error al guardar usuario', 'error');
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error de conexión al guardar usuario', 'error');
        })
        .finally(() => {
            showLoading(false);
        });
    }

    /**
     * Maneja la edición de un usuario
     */
    function handleEdit(e) {
        e.preventDefault();
        const id = $(this).data('id');

        showLoading(true);

        fetch(ENDPOINTS.get(id))
            .then(response => {
                if (!response.ok) {
                    throw new Error('Usuario no encontrado');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    openModalForEdit(data.data);
                } else {
                    showNotification('Error al cargar usuario: ' + data.message, 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error al cargar los datos del usuario', 'error');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    /**
     * Maneja el cambio de estado de un usuario
     */
    function handleToggleStatus(e) {
        e.preventDefault();
        const id = $(this).data('id');

        showLoading(true);

        fetch(ENDPOINTS.toggleStatus(id), {
            method: 'POST',
            headers: getCsrfHeaders()
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                loadUsuarios(); // Recargar la tabla
            } else {
                showNotification('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Error de conexión al cambiar estado', 'error');
        })
        .finally(() => {
            showLoading(false);
        });
    }

    /**
     * Maneja la eliminación de un usuario
     */
    function handleDelete(e) {
        e.preventDefault();
        const id = $(this).data('id');

        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esta acción!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, ¡eliminar!',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);

                fetch(ENDPOINTS.delete(id), {
                    method: 'DELETE',
                    headers: getCsrfHeaders()
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showNotification(data.message, 'success');
                        loadUsuarios(); // Recargar la tabla
                    } else {
                        showNotification('Error: ' + data.message, 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Error de conexión al eliminar usuario', 'error');
                })
                .finally(() => {
                    showLoading(false);
                });
            }
        });
    }

    /**
     * Abre el modal para crear nuevo usuario
     */
    function openModalForNew() {
        isEditing = false;
        clearForm();
        $('#modalTitle').text('Agregar Usuario');
        $('#clave').prop('required', true).attr('placeholder', '');
        showModal();
    }

    /**
     * Abre el modal para editar usuario
     */
    function openModalForEdit(usuario) {
        isEditing = true;
        clearForm();
        $('#modalTitle').text('Editar Usuario');

        $('#id').val(usuario.id);
        $('#nombre').val(usuario.nombre);
        $('#usuario').val(usuario.usuario);
        $('#correo').val(usuario.correo);
        $('#id_perfil').val(usuario.perfil ? usuario.perfil.id : '');
        $('#clave').val('').prop('required', false).attr('placeholder', 'Dejar en blanco para no cambiar');

        showModal();
    }

    /**
     * Muestra el modal
     */
    function showModal() {
        usuarioModal.show();
    }

    /**
     * Oculta el modal
     */
    function hideModal() {
        usuarioModal.hide();
        clearForm();
    }

    /**
     * Limpia el formulario y resetea el estado
     */
    function clearForm() {
        $('#formUsuario')[0].reset();
        $('#id').val(''); // Explicitly clear the hidden id field to prevent editing a previous selection
        $('#formUsuario .form-control').removeClass('is-invalid');
        $('.invalid-feedback').text('');
        isEditing = false;
    }

    /**
     * Valida el formulario del lado cliente
     */
    function validateForm(formData) {
        let hasErrors = false;
        clearFieldErrors();

        if (!formData.nombre) {
            showFieldError('nombre', 'El nombre es obligatorio');
            hasErrors = true;
        } else if (formData.nombre.length < 2) {
            showFieldError('nombre', 'El nombre debe tener al menos 2 caracteres');
            hasErrors = true;
        } else if (!REGEX_NOMBRE.test(formData.nombre)) {
            showFieldError('nombre', MSG_NOMBRE_INVALIDO);
            hasErrors = true;
        }

        if (!formData.usuario) {
            showFieldError('usuario', 'El usuario es obligatorio');
            hasErrors = true;
        } else if (formData.usuario.length < 3) {
            showFieldError('usuario', 'El usuario debe tener al menos 3 caracteres');
            hasErrors = true;
        } else if (!REGEX_USUARIO.test(formData.usuario)) {
            showFieldError('usuario', MSG_USUARIO_INVALIDO);
            hasErrors = true;
        }

        if (!formData.perfil.id) {
            showFieldError('id_perfil', 'Debe seleccionar un perfil');
            hasErrors = true;
        }

        if (!isEditing && !formData.clave) {
            showFieldError('clave', 'La contraseña es obligatoria');
            hasErrors = true;
        } else if (formData.clave && formData.clave.length < 6) {
            showFieldError('clave', 'La contraseña debe tener al menos 6 caracteres');
            hasErrors = true;
        }

        if (!formData.correo) {
            showFieldError('correo', 'El correo es obligatorio');
            hasErrors = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
            showFieldError('correo', 'El formato del correo no es válido');
            hasErrors = true;
        }

        return !hasErrors;
    }

    /**
     * Mensajes exactos para duplicados
     */
    const MENSAJES_DUPLICADOS = {
        nombre: 'Error: Nombre existente, ingrese otro nombre',
        usuario: 'Error: Usuario existente, ingrese otro usuario',
        correo: 'Error: Correo existente, ingrese otro correo'
    };

    /**
     * Detecta si el mensaje es de duplicado y devuelve campo + mensaje exacto
     */
    function obtenerMensajeDuplicado(message) {
        const msg = message.toLowerCase();
        if (msg.includes('nombre existente') || msg.includes('nombre existen')) {
            return { campo: 'nombre', mensaje: MENSAJES_DUPLICADOS.nombre };
        }
        if (msg.includes('usuario existente') || msg.includes('usuario existen')) {
            return { campo: 'usuario', mensaje: MENSAJES_DUPLICADOS.usuario };
        }
        if (msg.includes('correo existente') || msg.includes('correo existen')) {
            return { campo: 'correo', mensaje: MENSAJES_DUPLICADOS.correo };
        }
        return null;
    }

    /**
     * Detecta el campo asociado a un mensaje de error del servidor
     */
    function detectarCampoError(message) {
        const msg = message.toLowerCase();
        if (msg.includes('nombre existen') || msg.includes('nombre existente') || msg.includes('nombre solo puede') || msg.includes('nombre es obligatorio') || msg.includes('nombre debe')) {
            return 'nombre';
        }
        if (msg.includes('usuario existen') || msg.includes('usuario existente') || msg.includes('usuario solo puede') || msg.includes('usuario es obligatorio') || msg.includes('usuario debe')) {
            return 'usuario';
        }
        if (msg.includes('correo existen') || msg.includes('correo existente') || msg.includes('correo es obligatorio') || msg.includes('correo debe')) {
            return 'correo';
        }
        if (msg.includes('contraseña') || msg.includes('clave')) {
            return 'clave';
        }
        return null;
    }

    /**
     * Muestra error en un campo específico
     */
    function showFieldError(fieldName, message) {
        const field = $(`#${fieldName}`);
        const errorDiv = $(`#${fieldName}-error`);

        field.addClass('is-invalid');
        errorDiv.text(message);
    }

    /**
     * Limpia todos los errores de campo
     */
    function clearFieldErrors() {
        $('.invalid-feedback').text('');
        $('#formUsuario .form-control').removeClass('is-invalid');
    }

    /**
     * Muestra notificaciones toast
     */
    function showNotification(message, type = 'success') {
        const toastClass = type === 'success' ? 'text-bg-success' : 'text-bg-danger';

        const notification = $(`
            <div class="toast align-items-center ${toastClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `);

        $('#notification-container').append(notification);
        
        const toast = new bootstrap.Toast(notification, {
            delay: 5000
        });
        toast.show();
    }

    /**
     * Muestra/oculta indicador de carga
     */
    function showLoading(show) {
        const overlayId = 'loading-overlay';
        const $overlay = $(`#${overlayId}`);

        if (show) {
            if ($overlay.length === 0) {
                const spinner = $('<div>', { class: 'spinner-border text-primary', role: 'status' })
                    .append($('<span>', { class: 'visually-hidden' }).text('Loading...'));
                const newOverlay = $('<div>', { id: overlayId, class: 'loading-overlay' })
                    .append(spinner);
                $('body').append(newOverlay);
            }
        } else {
            $overlay.remove();
        }
    }
});