// ====================================
// VARIABLES GLOBALES
// ====================================
let trabajadores = [];
let vehiculos = [];

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// ====================================
// INICIALIZACIÓN DE LA APLICACIÓN
// ====================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando aplicación...');
    
    // Establecer fecha actual
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.valueAsDate = new Date();
    }
    
    // Cargar datos desde la base de datos
    cargarTrabajadores();
    cargarVehiculos();
    
    // Configurar todos los eventos
    configurarEventos();
    configurarEventosPestañas();
    configurarKilometrosDinamicos(); // Nueva funcionalidad
    
    // Cargar historial inicial con delay
    setTimeout(() => {
        cargarHistorial();
    }, 1000);
});

// ====================================
// CONFIGURACIÓN DE EVENTOS
// ====================================
function configurarEventosPestañas() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obtener el nombre de la pestaña
            let tabName = this.getAttribute('data-tab');
            
            if (tabName) {
                showTab(tabName, this);
            }
        });
    });
}

function configurarEventos() {
    // Evento del formulario principal
    const form = document.getElementById('bitacoraForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarRegistro();
        });
    }

    // Eventos para checkboxes dinámicos
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            const item = e.target.closest('.checkbox-item');
            if (item) {
                if (e.target.checked) {
                    item.classList.add('checked');
                } else {
                    item.classList.remove('checked');
                }
            }
        }
    });
}

// ====================================
// NUEVA FUNCIONALIDAD: KILÓMETROS DINÁMICOS
// ====================================
function configurarKilometrosDinamicos() {
    const tipoRegistroSelect = document.getElementById('tipoRegistro');
    const grupoKilometros = document.getElementById('grupoKilometros');
    const labelKilometros = document.getElementById('labelKilometros');
    const inputKilometros = document.getElementById('kilometros');

    if (!tipoRegistroSelect || !grupoKilometros || !labelKilometros || !inputKilometros) {
        console.warn('Elementos de kilómetros no encontrados');
        return;
    }

    tipoRegistroSelect.addEventListener('change', function() {
        const valor = this.value;
        
        if (valor === 'inicio_turno') {
            // Mostrar campo para kilómetros iniciales
            grupoKilometros.classList.remove('hidden');
            labelKilometros.textContent = 'Kilómetros Iniciales *';
            inputKilometros.placeholder = 'Ingrese kilómetros iniciales...';
            inputKilometros.required = true;
            
        } else if (valor === 'fin_turno') {
            // Mostrar campo para kilómetros finales
            grupoKilometros.classList.remove('hidden');
            labelKilometros.textContent = 'Kilómetros Finales *';
            inputKilometros.placeholder = 'Ingrese kilómetros finales...';
            inputKilometros.required = true;
            
        } else {
            // Ocultar campo para otros tipos
            grupoKilometros.classList.add('hidden');
            inputKilometros.required = false;
            inputKilometros.value = '';
        }
    });
}

// ====================================
// GESTIÓN DE PESTAÑAS
// ====================================
function showTab(tabName, buttonElement = null) {
    console.log('Cambiando a pestaña:', tabName);
    
    try {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remover clase active de todos los botones
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Mostrar el tab seleccionado
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        } else {
            console.error(`No se encontró el elemento con ID: ${tabName}`);
            return;
        }
        
        // Activar el botón correspondiente
        if (buttonElement) {
            buttonElement.classList.add('active');
        } else {
            const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
        
        // Cargar contenido específico según la pestaña
        switch(tabName) {
            case 'historial':
                console.log('Cargando historial...');
                cargarHistorial();
                break;
            case 'configuracion':
                console.log('Pestaña de configuración activada');
                break;
            case 'nuevo-registro':
                console.log('Pestaña de nuevo registro activada');
                break;
        }
        
    } catch (error) {
        console.error('Error al cambiar de pestaña:', error);
        mostrarMensaje('Error al cambiar de pestaña', 'danger');
    }
}

// ====================================
// GESTIÓN DE MENSAJES
// ====================================
function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje');
    if (div) {
        div.className = `alert alert-${tipo}`;
        div.textContent = mensaje;
        div.style.display = 'block';
        
        setTimeout(() => {
            div.style.display = 'none';
        }, 5000);
    } else {
        console.log(`${tipo.toUpperCase()}: ${mensaje}`);
        if (tipo === 'danger') {
            alert(`Error: ${mensaje}`);
        }
    }
}

// ====================================
// FUNCIONES DE API - TRABAJADORES
// ====================================
async function cargarTrabajadores() {
    try {
        console.log('Cargando trabajadores desde API...');
        const response = await fetch(`${API_BASE_URL}/trabajadores`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        trabajadores = await response.json();
        console.log('Trabajadores cargados:', trabajadores);

        const select = document.getElementById('trabajador');
        const filtroSelect = document.getElementById('filtroTrabajador');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccionar trabajador...</option>';
            trabajadores.forEach(trabajador => {
                const option = `<option value="${trabajador.id_trabajador}">${trabajador.nombre} - ${trabajador.turno}</option>`;
                select.innerHTML += option;
            });
        }
        
        if (filtroSelect) {
            filtroSelect.innerHTML = '<option value="">Todos los trabajadores</option>';
            trabajadores.forEach(trabajador => {
                const option = `<option value="${trabajador.id_trabajador}">${trabajador.nombre} - ${trabajador.turno}</option>`;
                filtroSelect.innerHTML += option;
            });
        }
        
    } catch (error) {
        console.error('Error cargando trabajadores:', error);
        mostrarMensaje('Error cargando trabajadores. Verifique la conexión.', 'warning');
    }
}

async function agregarTrabajador() {
    const nombre = document.getElementById('nuevoTrabajadorNombre')?.value?.trim() || '';
    const cedula = document.getElementById('nuevoTrabajadorCedula')?.value?.trim() || '';
    const turno = document.getElementById('nuevoTrabajadorTurno')?.value || '';

    if (!nombre || !cedula || !turno) {
        mostrarMensaje('Por favor complete todos los campos del trabajador', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/trabajadores`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nombre, cedula, turno })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error del servidor');
        }

        // Limpiar campos
        document.getElementById('nuevoTrabajadorNombre').value = '';
        document.getElementById('nuevoTrabajadorCedula').value = '';
        document.getElementById('nuevoTrabajadorTurno').value = '';

        mostrarMensaje(`Trabajador "${nombre}" agregado exitosamente`, 'success');
        await cargarTrabajadores();

    } catch (error) {
        console.error('Error agregando trabajador:', error);
        mostrarMensaje(`Error: ${error.message}`, 'danger');
    }
}

// ====================================
// FUNCIONES DE API - VEHÍCULOS
// ====================================
async function cargarVehiculos() {
    try {
        console.log('Cargando vehículos desde API...');
        const response = await fetch(`${API_BASE_URL}/vehiculos`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        vehiculos = await response.json();
        console.log('Vehículos cargados:', vehiculos);

        const select = document.getElementById('vehiculo');
        const filtroSelect = document.getElementById('filtroVehiculo');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccionar vehículo...</option>';
            vehiculos.forEach(vehiculo => {
                const option = `<option value="${vehiculo.id_vehiculo}">${vehiculo.placa} - ${vehiculo.modelo}</option>`;
                select.innerHTML += option;
            });
        }
        
        if (filtroSelect) {
            filtroSelect.innerHTML = '<option value="">Todos los vehículos</option>';
            vehiculos.forEach(vehiculo => {
                const option = `<option value="${vehiculo.id_vehiculo}">${vehiculo.placa} - ${vehiculo.modelo}</option>`;
                filtroSelect.innerHTML += option;
            });
        }
        
    } catch (error) {
        console.error('Error cargando vehículos:', error);
        mostrarMensaje('Error cargando vehículos. Verifique la conexión.', 'warning');
    }
}

async function agregarVehiculo() {
    const placa = document.getElementById('nuevoVehiculoPlaca')?.value?.trim()?.toUpperCase() || '';
    const modelo = document.getElementById('nuevoVehiculoModelo')?.value?.trim() || '';
    const año = document.getElementById('nuevoVehiculoAno')?.value || '';
    const tipo = document.getElementById('nuevoVehiculoTipo')?.value?.trim() || '';

    if (!placa) {
        mostrarMensaje('La placa es obligatoria', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/vehiculos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                placa, 
                modelo: modelo || null, 
                año: año ? parseInt(año) : null, 
                tipo_vehiculo: tipo || null 
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error del servidor');
        }

        // Limpiar campos
        document.getElementById('nuevoVehiculoPlaca').value = '';
        document.getElementById('nuevoVehiculoModelo').value = '';
        document.getElementById('nuevoVehiculoAno').value = '';
        document.getElementById('nuevoVehiculoTipo').value = '';

        mostrarMensaje(`Vehículo "${placa}" agregado exitosamente`, 'success');
        await cargarVehiculos();

    } catch (error) {
        console.error('Error agregando vehículo:', error);
        mostrarMensaje(`Error: ${error.message}`, 'danger');
    }
}

// ====================================
// FUNCIONES DE API - BITÁCORA
// ====================================
async function guardarRegistro() {
    const formData = recopilarDatosFormulario();

    console.log('Kilómetros capturados:', formData.kilometros);
    
    // Validar datos requeridos
    if (!validarDatosRequeridos(formData)) {
        mostrarMensaje('Por favor complete todos los campos obligatorios', 'danger');
        return;
    }

    // Preparar datos para la API
    const datosAPI = {
        id_trabajador: parseInt(formData.trabajador),
        id_vehiculo: parseInt(formData.vehiculo),
        fecha: formData.fecha,
        turno: formData.turno,
        tipo_registro: formData.tipoRegistro,
        kilometros: formData.kilometros ? parseFloat(formData.kilometros) : null, // NUEVO CAMPO
        observaciones_generales: formData.observacionesGenerales || null,
        equipo: formData.equipo,
        vehiculo_checks: formData.vehiculoCheck,
        combustible: {
            carga_combustible: formData.cargaCombustible ? parseFloat(formData.cargaCombustible) : null,
            observaciones_combustible: formData.observacionesCombustible || null
        }
    };

    console.log('Enviando datos a la API:', datosAPI);

    try {
        // Mostrar indicador de carga
        const submitBtn = document.querySelector('button[type="submit"]');
        const originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.textContent = 'Guardando...';
            submitBtn.disabled = true;
        }

        const response = await fetch(`${API_BASE_URL}/bitacora`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosAPI)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error del servidor');
        }

        mostrarMensaje('Registro guardado exitosamente en la base de datos', 'success');
        limpiarFormulario();
        
        // Recargar historial si está activo
        if (document.getElementById('historial')?.classList.contains('active')) {
            cargarHistorial();
        }

    } catch (error) {
        console.error('Error guardando registro:', error);
        mostrarMensaje(`Error: ${error.message}`, 'danger');
    } finally {
        // Restaurar botón
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Guardar Registro';
            submitBtn.disabled = false;
        }
    }
}

async function cargarHistorial() {
    try {
        const resultadosDiv = document.getElementById('resultadosHistorial');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Cargando registros desde la base de datos...</p>
                </div>
            `;
        }

        console.log('Cargando historial desde API...');
        const response = await fetch(`${API_BASE_URL}/bitacora`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const registros = await response.json();
        console.log('Registros cargados:', registros);
        
        mostrarTablaHistorial(registros);
        
    } catch (error) {
        console.error('Error cargando historial:', error);
        const resultadosDiv = document.getElementById('resultadosHistorial');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = `
                <div class="alert alert-danger">
                    <strong>Error:</strong> No se pudo cargar el historial. ${error.message}
                </div>
            `;
        }
    }
}

function mostrarTablaHistorial(registros) {
    const resultadosDiv = document.getElementById('resultadosHistorial');
    if (!resultadosDiv) {
        console.error('No se encontró el elemento resultadosHistorial');
        return;
    }

    if (registros.length === 0) {
        resultadosDiv.innerHTML = `
            <div class="alert alert-info">
                <strong>Sin registros:</strong> No se encontraron registros con los filtros aplicados.
            </div>
        `;
        return;
    }

    let tablaHTML = `
        <table class="records-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Trabajador</th>
                    <th>Vehículo</th>
                    <th>Turno</th>
                    <th>Tipo</th>
                    <th>Kilómetros</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;

    registros.forEach(registro => {
        console.log('Registro:', registro.id_bitacora, 'Kilómetros:', registro.kilometros);
        const fechaFormateada = new Date(registro.fecha).toLocaleDateString('es-ES');
        const observaciones = registro.observaciones_generales 
            ? (registro.observaciones_generales.length > 50 
                ? registro.observaciones_generales.substring(0, 50) + '...' 
                : registro.observaciones_generales)
            : 'Sin observaciones';
        
        const kilometros = registro.kilometros 
            ? `${registro.kilometros} km`
            : '-';
        
        tablaHTML += `
            <tr>
                <td>${fechaFormateada}</td>
                <td>${registro.trabajador_nombre || 'N/A'}</td>
                <td>${registro.vehiculo_placa || 'N/A'} - ${registro.vehiculo_modelo || 'N/A'}</td>
                <td>${registro.turno}</td>
                <td>${registro.tipo_registro ? registro.tipo_registro.replace('_', ' ') : 'N/A'}</td>
                <td>${kilometros}</td>
                <td>${observaciones}</td>
                <td>
                    <button onclick="verDetalle(${registro.id_bitacora})" class="btn-info" style="padding: 5px 10px; font-size: 0.85em;">Ver</button>
                </td>
            </tr>
        `;
    });

    tablaHTML += `
            </tbody>
        </table>
    `;

    resultadosDiv.innerHTML = tablaHTML;
}

async function buscarRegistros() {
    try {
        const filtros = {
            trabajador: document.getElementById('filtroTrabajador')?.value || '',
            vehiculo: document.getElementById('filtroVehiculo')?.value || '',
            fechaDesde: document.getElementById('fechaDesde')?.value || '',
            fechaHasta: document.getElementById('fechaHasta')?.value || ''
        };

        console.log('Aplicando filtros:', filtros);
        
        const resultadosDiv = document.getElementById('resultadosHistorial');
        if (resultadosDiv) {
            resultadosDiv.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Buscando registros en la base de datos...</p>
                </div>
            `;
        }

        const params = new URLSearchParams();
        Object.keys(filtros).forEach(key => {
            if (filtros[key]) {
                params.append(key, filtros[key]);
            }
        });

        const response = await fetch(`${API_BASE_URL}/bitacora?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const registros = await response.json();
        mostrarTablaHistorial(registros);
        mostrarMensaje('Búsqueda completada', 'success');
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        mostrarMensaje(`Error en la búsqueda: ${error.message}`, 'danger');
    }
}

async function verDetalle(idBitacora) {
    try {
        console.log('Obteniendo detalle del registro:', idBitacora);
        const response = await fetch(`${API_BASE_URL}/bitacora/${idBitacora}`);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const detalle = await response.json();
        console.log('Detalle del registro:', detalle);
        
        // Crear ventana modal con los detalles
        let detalleHTML = `
🔍 DETALLE DEL REGISTRO

📅 Fecha: ${new Date(detalle.fecha).toLocaleDateString('es-ES')}
👤 Trabajador: ${detalle.trabajador_nombre} (${detalle.trabajador_cedula})
🚗 Vehículo: ${detalle.placa} - ${detalle.modelo} (${detalle.año})
⏰ Turno: ${detalle.turno}
📝 Tipo: ${detalle.tipo_registro.replace('_', ' ')}
🛣️ Kilómetros: ${detalle.kilometros ? detalle.kilometros + ' km' : 'No registrado'}

📝 Observaciones Generales:
${detalle.observaciones_generales || 'Sin observaciones'}

⛽ Combustible:
${detalle.carga_combustible ? `Carga: ${detalle.carga_combustible}L` : 'Sin carga registrada'}
${detalle.observaciones_combustible ? `Observaciones: ${detalle.observaciones_combustible}` : ''}

🔧 ESTADO DEL EQUIPO:
${detalle.pertiga ? '✅' : '❌'} Pértiga
${detalle.escalera_baja ? '✅' : '❌'} Escalera de Baja
${detalle.escalera_media ? '✅' : '❌'} Escalera de Media
${detalle.detector_13_2kv ? '✅' : '❌'} Detector 13,2KV
${detalle.puesta_tierra_jabalina ? '✅' : '❌'} Puesta a Tierra + Jabalina
${detalle.pinza_identar_hidraulica ? '✅' : '❌'} Pinza de Identar Hidráulica
${detalle.aparejo ? '✅' : '❌'} Aparejo
${detalle.morzas_autoajustables ? '✅' : '❌'} Morzas Autoajustables
${detalle.barreta ? '✅' : '❌'} Barreta
${detalle.ganchos ? '✅' : '❌'} Ganchos
${detalle.escafandra ? '✅' : '❌'} Escafandra
${detalle.boga_servicio ? '✅' : '❌'} Boga de Servicio
${detalle.amperometrica ? '✅' : '❌'} Amperométrica
${detalle.rotafasimetro ? '✅' : '❌'} Rotafasímetro
${detalle.linterna ? '✅' : '❌'} Linterna
${detalle.herramientas_mano ? '✅' : '❌'} Herramientas de Mano

🚗 ESTADO DEL VEHÍCULO:
${detalle.seguro ? '✅' : '❌'} Seguro
${detalle.cedula_vehiculo ? '✅' : '❌'} Cédula Vehículo
${detalle.luces ? '✅' : '❌'} Luces
${detalle.balizas ? '✅' : '❌'} Balizas
${detalle.aceite ? '✅' : '❌'} Aceite
${detalle.agua ? '✅' : '❌'} Agua
${detalle.liquido_freno ? '✅' : '❌'} Líquido de Freno
${detalle.rodados_presion ? '✅' : '❌'} Rodados Presión
${detalle.matafueg ? '✅' : '❌'} Matafuego
${detalle.auxilio_gato ? '✅' : '❌'} Auxilio-Gato
${detalle.conos_soga ? '✅' : '❌'} Conos (Soga)
${detalle.botiquin ? '✅' : '❌'} Botiquín
        `;
        
        alert(detalleHTML);
        
    } catch (error) {
        console.error('Error obteniendo detalle:', error);
        mostrarMensaje(`Error obteniendo detalle: ${error.message}`, 'danger');
    }
}

// ====================================
// FUNCIONES AUXILIARES
// ====================================
function recopilarDatosFormulario() {
    const datos = {
        trabajador: document.getElementById('trabajador')?.value || '',
        vehiculo: document.getElementById('vehiculo')?.value || '',
        fecha: document.getElementById('fecha')?.value || '',
        turno: document.getElementById('turno')?.value || '',
        tipoRegistro: document.getElementById('tipoRegistro')?.value || '',
        kilometros: document.getElementById('kilometros')?.value || '', // NUEVO CAMPO
        observacionesGenerales: document.getElementById('observacionesGenerales')?.value || '',
        cargaCombustible: document.getElementById('cargaCombustible')?.value || '',
        observacionesCombustible: document.getElementById('observacionesCombustible')?.value || '',
        equipo: {},
        vehiculoCheck: {}
    };

    // Recopilar checkboxes de equipo
    document.querySelectorAll('input[name="equipo"]').forEach(checkbox => {
        datos.equipo[checkbox.id] = checkbox.checked;
    });

    // Recopilar checkboxes de vehículo
    document.querySelectorAll('input[name="vehiculo"]').forEach(checkbox => {
        datos.vehiculoCheck[checkbox.id] = checkbox.checked;
    });

    return datos;
}

function validarDatosRequeridos(datos) {
    // Validaciones básicas
    if (!datos.trabajador || !datos.vehiculo || !datos.fecha || !datos.turno || !datos.tipoRegistro) {
        return false;
    }
    
    // Validar kilómetros si es requerido
    if ((datos.tipoRegistro === 'inicio_turno' || datos.tipoRegistro === 'fin_turno') && !datos.kilometros) {
        return false;
    }
    
    return true;
}

function limpiarFormulario() {
    const form = document.getElementById('bitacoraForm');
    if (form) {
        form.reset();
    }
    
    // Restablecer fecha actual
    const fechaField = document.getElementById('fecha');
    if (fechaField) {
        fechaField.valueAsDate = new Date();
    }
    
    // Ocultar campo de kilómetros
    const grupoKilometros = document.getElementById('grupoKilometros');
    if (grupoKilometros) {
        grupoKilometros.classList.add('hidden');
    }
    
    // Remover clases checked de checkboxes
    document.querySelectorAll('.checkbox-item.checked').forEach(item => {
        item.classList.remove('checked');
    });
}

// ====================================
// VERIFICACIÓN DE CONEXIÓN
// ====================================
async function verificarConexion() {
    try {
        const response = await fetch(`${API_BASE_URL}/trabajadores`);
        if (response.ok) {
            console.log('Conexión con el servidor establecida');
            mostrarMensaje('Conexión con servidor establecida', 'success');
            return true;
        }
    } catch (error) {
        console.log('No se pudo conectar con el servidor:', error.message);
        mostrarMensaje('Modo offline: No se pudo conectar con el servidor', 'warning');
        return false;
    }
}

// ====================================
// FUNCIONES GLOBALES PARA HTML
// ====================================
window.showTab = showTab;
window.buscarRegistros = buscarRegistros;
window.verDetalle = verDetalle;
window.agregarTrabajador = agregarTrabajador;
window.agregarVehiculo = agregarVehiculo;
window.verificarConexion = verificarConexion;