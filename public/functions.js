// Variables globales
let trabajadores = [];
let vehiculos = [];

// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Establecer fecha actual
    document.getElementById('fecha').valueAsDate = new Date();
    
    // Cargar datos desde la base de datos
    cargarTrabajadores();
    cargarVehiculos();
    
    // Configurar eventos
    configurarEventos();
    
    // Configurar eventos de pestañas
    configurarEventosPestañas();
    
    // Cargar historial inicial
    setTimeout(() => {
        cargarHistorial();
    }, 1000);
});

// NUEVA FUNCIÓN: Configurar eventos de pestañas
function configurarEventosPestañas() {
    // Seleccionar todos los botones de pestañas
    const tabButtons = document.querySelectorAll('.nav-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obtener el nombre de la pestaña desde data-tab o desde el onclick
            let tabName = this.getAttribute('data-tab');
            
            // Si no tiene data-tab, intentar extraer del onclick
            if (!tabName) {
                const onclickAttr = this.getAttribute('onclick');
                if (onclickAttr) {
                    // Extraer el nombre entre comillas de showTab('nombre')
                    const match = onclickAttr.match(/showTab\(['"]([^'"]+)['"]\)/);
                    if (match) {
                        tabName = match[1];
                    }
                }
            }
            
            if (tabName) {
                showTab(tabName, this);
            }
        });
    });
}

function configurarEventos() {
    // Evento del formulario
    document.getElementById('bitacoraForm').addEventListener('submit', function(e) {
        e.preventDefault();
        guardarRegistro();
    });

    // Eventos para checkboxes dinámicos
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
            const item = e.target.closest('.checkbox-item');
            if (e.target.checked) {
                item.classList.add('checked');
            } else {
                item.classList.remove('checked');
            }
        }
    });
}

// FUNCIÓN CORREGIDA: showTab
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
            // Buscar el botón por data-tab o onclick
            const activeButton = document.querySelector(`[data-tab="${tabName}"], [onclick*="showTab('${tabName}')"]`);
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
                // Cargar listas de trabajadores y vehículos para administración
                cargarListaTrabajadores();
                cargarListaVehiculos();
                break;
            case 'nuevo-registro':
                console.log('Pestaña de nuevo registro activada');
                // Lógica para nuevo registro si es necesaria
                break;
            default:
                console.log(`Pestaña ${tabName} activada`);
        }
        
    } catch (error) {
        console.error('Error al cambiar de pestaña:', error);
        mostrarMensaje('Error al cambiar de pestaña', 'danger');
    }
}

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
        // Fallback si no existe el elemento mensaje
        console.log(`${tipo.toUpperCase()}: ${mensaje}`);
        if (tipo === 'danger') {
            alert(`Error: ${mensaje}`);
        }
    }
}

// ===============================================
// FUNCIONES CONECTADAS CON LA API
// ===============================================

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
        mostrarMensaje('Error cargando trabajadores. Usando datos locales.', 'warning');
    }
}

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
                const option = `<option value="${vehiculo.id_vehiculo}">${vehiculo.placa} - ${vehiculo.modelo}</option>