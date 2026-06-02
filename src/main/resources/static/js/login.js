document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const registroForm = document.querySelector('.registro-form');
    const loginContainer = document.querySelector('.login-container');
    const registroContainer = document.querySelector('.registro-container');
    const mensajeRegistro = document.getElementById('mensajeRegistro');
    const mensajeLogin = document.getElementById('mensajeLogin');

    // Maneja la navegación entre formularios
    const linkRegister = document.getElementById('link-register');
    const linkLogin = document.getElementById('link-login');

    linkRegister.addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registroContainer.style.display = 'block';
    });

    linkLogin.addEventListener('click', (e) => {
        e.preventDefault();
        registroContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });
    
    // ... (El resto del código JavaScript de registro y login se mantiene igual)

    // Lógica para el formulario de REGISTRO
    registroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        mensajeRegistro.style.display = 'none';

        if (password !== confirmPassword) {
            mostrarMensaje(mensajeRegistro, 'Las contraseñas no coinciden.', 'error');
            return;
        }

        // SIMULACIÓN de REGISTRO exitoso
        console.log('Usuario registrado:', email);
        mostrarMensaje(mensajeRegistro, '¡Registrado exitosamente!', 'exito');

        registroForm.reset();
        
        // Redirige al login después de un registro exitoso
        setTimeout(() => {
            loginContainer.style.display = 'block';
            registroContainer.style.display = 'none';
            // Muestra el mensaje en el formulario de login
            mostrarMensaje(mensajeLogin, '¡Registrado exitosamente!', 'exito');
        }, 1500); // Espera 1.5 segundos antes de redirigir
    });

    // Lógica para el formulario de LOGIN
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        mensajeLogin.style.display = 'none';

        // SIMULACIÓN de validación de credenciales
        const credencialesCorrectas = (email === 'ejemplo@correo.com' && password === '123456');

        if (credencialesCorrectas) {
            console.log('Inicio de sesión exitoso');
            mostrarMensaje(mensajeLogin, '¡Inicio de sesión exitoso!', 'exito');
        } else {
            console.log('Credenciales incorrectas');
            mostrarMensaje(mensajeLogin, 'Tu usuario o contraseña son incorrectos.', 'error');
        }

        loginForm.reset();
    });

    function mostrarMensaje(contenedor, texto, tipo) {
        contenedor.textContent = texto;
        contenedor.className = 'mensaje-container';
        if (tipo === 'exito') {
            contenedor.classList.add('mensaje-exito');
        } else {
            contenedor.classList.add('mensaje-error');
        }
        contenedor.style.display = 'block';
    }
});


        document.getElementById('swal-success').addEventListener('click', () => {
            Swal.fire({
                title: '¡Cuenta Creada Correctamente!',
                text: 'La cuenta se ha completado correctamente.',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        });

        document.getElementById('swal-error').addEventListener('click', () => {
            Swal.fire({
                title: '¡Error!',
                text: 'Algo salió mal. Por favor, inténtalo de nuevo.',
                icon: 'error',
                confirmButtonText: 'Entendido'
            });
        });

        document.getElementById('swal-confirm').addEventListener('click', () => {
            Swal.fire({
                title: '¿Estás seguro?',
                text: "No podrás revertir esto.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, ¡bórralo!'
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire('¡Eliminado!', 'Tu archivo ha sido eliminado.', 'success');
                }
            });
        });

        document.getElementById('swal-input').addEventListener('click', async () => {
            const { value: ipAddress } = await Swal.fire({
                title: 'Ingresa tu dirección IP',
                input: 'text',
                inputLabel: 'Tu dirección IP',
                inputPlaceholder: '127.0.0.1'
            });

            if (ipAddress) {
                Swal.fire(`Tu IP es: ${ipAddress}`);
            }
        });