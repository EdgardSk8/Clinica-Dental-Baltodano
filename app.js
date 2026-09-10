
document.addEventListener('DOMContentLoaded', async () => {

    try {

        // OBTENER SLUG DE LA URL
        const params = new URLSearchParams(window.location.search);
        const slug = params.get('slug')?.trim();
        if (!slug) {throw new Error('No se especificó el usuario.');}

        // CONSULTAR USUARIO EN SUPABASE
        const { data: usuario, error: errorUsuario } =
            await supabaseClient.from('usuarios').select('*').eq('slug', slug).eq('activo', true).single();

        if (errorUsuario) {
            console.error('Error al consultar usuario:', errorUsuario);
            throw new Error(errorUsuario.message || 'Error al consultar el usuario.');
        }

        if (!usuario) {throw new Error('Usuario no encontrado.');}

        // CONSULTAR CIUDAD EN SUPABASE
        let ciudad = null;

        if (usuario.ciudad_id) {

            const { data: datosCiudad, error: errorCiudad } =
                await supabaseClient .from('ciudades').select('*').eq('id', usuario.ciudad_id).eq('activa', true).single();

            if (errorCiudad) {
                console.error( 'Error al consultar ciudad:', errorCiudad);
                throw new Error('Error al consultar la ciudad.');
            }
            ciudad = datosCiudad;
        }

        // CONSULTAR REDES SOCIALES EN SUPABASE
        let redes = null;
        if (usuario.ciudad_id) {

            const { data: datosRedes, error: errorRedes } =
                await supabaseClient.from('redes_sociales').select('*').eq('ciudad_id', 
                    usuario.ciudad_id).eq('activa', true).limit(1).maybeSingle();

            if (errorRedes) {
                console.error('Error al consultar redes sociales:', errorRedes);
                throw new Error('Error al consultar las redes sociales.');
            }
            redes = datosRedes;
        }

        generarPresentacion( usuario, ciudad || {} ); // PRESENTACIÓN
        DatosUsuarios( usuario, ciudad || {} ); // DATOS DEL USUARIO
        generarUbicacion(ciudad || {} ); // UBICACIÓN
        RedesSociales( redes || {} ); // REDES SOCIALES

    } catch (error) { console.error(error); mostrarError(error.message); }

});

// GENERAR PRESENTACIÓN
function generarPresentacion(usuario, ciudad) {

    const contenedor =document.getElementById('presentacion_contenido');
    if (!contenedor) {return;} contenedor.innerHTML = '';

    if (usuario.nombre) { // NOMBRE
        const nombre = document.createElement('h1');
        nombre.className = 'presentacion_nombre';
        nombre.textContent = usuario.nombre;
        contenedor.appendChild(nombre);
    }

    if (ciudad.nombre) { // CIUDAD
        const ciudadElemento = document.createElement('p');
        ciudadElemento.className = 'presentacion_ciudad';
        ciudadElemento.textContent = ciudad.nombre;
        contenedor.appendChild(ciudadElemento);
    }

}

// GENERAR UBICACIÓN
function generarUbicacion(ciudad) {

    const contenedor = document.getElementById('ubicacion_datos');
    if (!contenedor) { return; }
    contenedor.innerHTML = '';

    if (!ciudad || !ciudad.url_mapa) {
        const mensaje = document.createElement('p');
        mensaje.textContent = 'Sin ubicación actualmente';
        contenedor.appendChild(mensaje); return;
    }

    const mapa = document.createElement('iframe');
    mapa.src = ciudad.url_mapa;
    mapa.loading = 'lazy';
    mapa.allowFullscreen = true;
    mapa.referrerPolicy = 'no-referrer-when-downgrade';
    contenedor.appendChild(mapa);
}

// GENERAR ENLACE WHATSAPP
function generarEnlaceWhatsApp(numero) {
    if (!numero) { return '#'; }
    numero = String(numero).replace(/\D/g, '');// Eliminar espacios, guiones, +, etc.

    // Si el numero tiene 8 digitos automaticamente Nicaraguense
    if ( numero.length === 8 ) { numero = '505' + numero;} return `https://wa.me/${numero}`;
}

// CONVERTIR NOMBRE DE COLUMNA
function convertirNombreCampo(campo) {
    const nombres = { nombre: 'Nombre', cedula: 'Cédula', email: 'Email', telefono1: 'Teléfono', telefono2: 'Teléfono 2' };
    if ( nombres[campo] ) { return nombres[campo]; }
    return campo .replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace( /\b\w/g, letra => letra.toUpperCase());
}

// MOSTRAR ERROR
function mostrarError(mensaje) {
    const contenedor = document.getElementById('presentacion_contenido');
    if (!contenedor) {return;}
    contenedor.innerHTML = '';
    const error =document.createElement('p');
    error.className = 'perfil_error';
    error.textContent = mensaje || 'Usuario no encontrado';
    contenedor.appendChild(error);
}

/* =============================================================== */

// GENERAR DATOS DEL USUARIO
function DatosUsuarios(usuario, ciudad) {

    const contenedor = document.getElementById('datos_usuario_contenedor');
    if (!contenedor) {return;}
    contenedor.innerHTML = '';

    // CAMPOS QUE NO SE DEBEN MOSTRAR
    const camposOcultos = ['id', 'slug', 'ciudad_id', 'activo', 'created_at', 'updated_at'];

    // FUNCIÓN PARA CREAR UN DATO
    function agregarDato(etiquetaTexto, valor) {

        if ( valor === null || valor === undefined || valor === '') {return;}
        const iconoClase = obtenerIconoCampo(etiquetaTexto);

        const tarjetaHTML = `
            <div class="col">

                <div class="card h-100 border-0 shadow-sm rounded-4 p-3 transition-hover custom-card">

                    <div class="card-body d-flex align-items-center gap-3 p-0">

                        <div class="icon-box-sm rounded-3 custom-primary-subtle custom-primary d-flex align-items-center justify-content-center flex-shrink-0"> <i class="${iconoClase}"></i> </div>

                        <div class="overflow-hidden">
                            <span class="d-block text-uppercase custom-text-secondary fw-bold fs-7 tracking-wider mb-1"> ${etiquetaTexto} </span>
                            <span class="d-block custom-text fw-bold text-truncate fs-8"> ${valor} </span>
                        </div>

                    </div>

                </div>

            </div>
        `;
        contenedor.insertAdjacentHTML( 'beforeend', tarjetaHTML);
    }

    // ASIGNAR ICONO DINÁMICO SEGÚN EL CAMPO
    function obtenerIconoCampo(etiqueta) {

        const iconos = {
            'Nombre': 'fa-solid fa-user',
            'Cédula': 'fa-solid fa-id-card',
            'Email': 'fa-solid fa-envelope',
            'Teléfono': 'fa-solid fa-phone',
            'Teléfono 2': 'fa-solid fa-mobile-screen',
            'Ciudad': 'fa-solid fa-city'
        };

        return (iconos[etiqueta] || 'fa-solid fa-circle-info');
    }

    // DATOS DEL USUARIO
    Object.entries(usuario).forEach(([campo, valor]) => {if (camposOcultos.includes(campo)) {return;} agregarDato(convertirNombreCampo(campo),valor);});

    // CIUDAD
    if (ciudad && ciudad.nombre) {agregarDato('Ciudad', ciudad.nombre); }

}

// GENERAR REDES SOCIALES
function RedesSociales(redes) {

    const contenedor = document.getElementById('footer_redes');
    if (!contenedor) {return;}
    contenedor.innerHTML = '';

    const redesDisponibles = [

        { nombre: 'Facebook', campo: 'facebook', icono: 'fa-brands fa-facebook-f', color: '#1877F2' },
        { nombre: 'Instagram', campo: 'instagram', icono: 'fa-brands fa-instagram', color: '#E4405F' },
        { nombre: 'TikTok', campo: 'tiktok', icono: 'fa-brands fa-tiktok', color: '#010101' },
        { nombre: 'YouTube', campo: 'youtube', icono: 'fa-brands fa-youtube', color: '#FF0000' },
        { nombre: 'X', campo: 'x', icono: 'fa-brands fa-x-twitter', color: '#212529' },
        { nombre: 'WhatsApp', campo: 'whatsapp', icono: 'fa-brands fa-whatsapp', color: '#25D366' }

    ];

    redesDisponibles.forEach(

        red => {
        let url = redes[red.campo]; if (!url) return; if (red.campo === 'whatsapp') url = generarEnlaceWhatsApp(url);

            const tarjetaHTML = `

                <div class="col con-redes">

                    <a 
                        href="${url}" target="_blank" rel="noopener noreferrer"
                        class="card text-decoration-none border-0 shadow-sm rounded-4 p-1 px-3 transition-hover h-100 custom-social-card"
                        style="--social-color: ${red.color};"
                    >

                        <div class="card-body d-flex align-items-center gap-2 p-0">

                            <div class="icon-box-sm rounded-3 custom-icon-box d-flex align-items-center justify-content-center flex-shrink-0">
                                <i class="${red.icono} custom-social-icon-size custom-social-icon-color"></i>
                            </div>


                            <div class="overflow-hidden">
                                <span class="d-block fw-bold text-truncate custom-social-title custom-social-text-color">${red.nombre}</span>
                            </div>

                        </div>

                    </a>

                </div>
            `;
            contenedor.insertAdjacentHTML('beforeend', tarjetaHTML);
        }
    );

}