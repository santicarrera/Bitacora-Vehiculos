// ===============================================
// SERVER.JS - SERVIDOR PRINCIPAL NODE.JS
// ===============================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir archivos estáticos

// Configuración de la base de datos MySQL
const dbPath = process.env.NODE_ENV === 'production' ? '/opt/render/project/src/database.sqlite' : './database.sqlite';
const db = new sqlite3.Database(dbPath);

// Conectar a la base de datos
db.serialize(() => {
    console.log('✅ Base de datos SQLite inicializada');
    crearTablasIniciales();
});

// ===============================================
// RUTAS DE LA API
// ===============================================

// Ruta para servir la aplicación principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===============================================
// TRABAJADORES
// ===============================================

app.get('/api/trabajadores', (req, res) => {
    const query = 'SELECT * FROM trabajadores WHERE activo = 1 ORDER BY nombre';
    
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error obteniendo trabajadores:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(rows);
    });
});

// Agregar nuevo trabajador
app.post('/api/trabajadores', (req, res) => {
    const { nombre, cedula, turno } = req.body;
    
    if (!nombre || !cedula || !turno) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    
    const query = 'INSERT INTO trabajadores (nombre, cedula, turno) VALUES (?, ?, ?)';
    
    db.run(query, [nombre, cedula, turno], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Ya existe un trabajador con esa cédula' });
            }
            console.error('Error agregando trabajador:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
    
        res.json({
            message: 'Trabajador agregado exitosamente',
            id: this.lastID
        });
    });
});

// Eliminar trabajador
app.delete('/api/trabajadores/:id', (req, res) => {
    const trabajadorId = req.params.id;
    
    const query = 'UPDATE trabajadores SET activo = 0 WHERE id_trabajador = ?';
    
    db.run(query, [trabajadorId], function(err) {
        if (err) {
            console.error('Error eliminando trabajador:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
    
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Trabajador no encontrado' });
        }
    
        res.json({ message: 'Trabajador eliminado exitosamente' });
    });
});

// ===============================================
// VEHÍCULOS
// ===============================================

// Obtener todos los vehículos
app.get('/api/vehiculos', (req, res) => {
    const query = 'SELECT * FROM vehiculos WHERE activo = 1 ORDER BY placa';
    db.all(query, (err, rows) => {
        if (err) {
            console.error('Error obteniendo vehículos:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(rows);
    });
});

// Agregar nuevo vehículo
app.post('/api/vehiculos', (req, res) => {
    const { placa, modelo, año, tipo_vehiculo } = req.body;
    
    if (!placa) {
        return res.status(400).json({ error: 'La placa es obligatoria' });
    }
    
    const query = 'INSERT INTO vehiculos (placa, modelo, año, tipo_vehiculo) VALUES (?, ?, ?, ?)';
    
    db.run(query, [placa, modelo || null, año || null, tipo_vehiculo || null], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Ya existe un vehículo con esa placa' });
            }
            console.error('Error agregando vehículo:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
    
        res.json({
            message: 'Vehículo agregado exitosamente',
            id: this.lastID
        });
    });
});

// Eliminar vehículo
app.delete('/api/vehiculos/:id', (req, res) => {
    const vehiculoId = req.params.id;
    
    const query = 'UPDATE vehiculos SET activo = 0 WHERE id_vehiculo = ?';
    
    db.run(query, [vehiculoId], function(err) {
        if (err) {
            console.error('Error eliminando vehículo:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
    
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Vehículo no encontrado' });
        }
    
        res.json({ message: 'Vehículo eliminado exitosamente' });
    });
});

// ===============================================
// BITÁCORA
// ===============================================

// Obtener registros de bitácora con filtros
app.get('/api/bitacora', (req, res) => {
    const { trabajador, vehiculo, fechaDesde, fechaHasta, limit = 50 } = req.query;
    
    let query = `
        SELECT 
            b.id_bitacora,
            b.fecha,
            b.turno,
            b.tipo_registro,
            b.kilometros,
            b.acompanante,
            b.observaciones_generales,
            b.fecha_registro,
            t.nombre as trabajador_nombre,
            v.placa as vehiculo_placa,
            v.modelo as vehiculo_modelo
        FROM bitacora_vehiculo b
        JOIN trabajadores t ON b.id_trabajador = t.id_trabajador
        JOIN vehiculos v ON b.id_vehiculo = v.id_vehiculo
        WHERE 1=1
    `;
    
    const params = [];
    
    if (trabajador) {
        query += ' AND b.id_trabajador = ?';
        params.push(trabajador);
    }
    
    if (vehiculo) {
        query += ' AND b.id_vehiculo = ?';
        params.push(vehiculo);
    }
    
    if (fechaDesde) {
        query += ' AND b.fecha >= ?';
        params.push(fechaDesde);
    }
    
    if (fechaHasta) {
        query += ' AND b.fecha <= ?';
        params.push(fechaHasta);
    }
    
    query += ' ORDER BY b.fecha DESC, b.fecha_registro DESC LIMIT ?';
    params.push(parseInt(limit));
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error obteniendo registros:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(rows);
    });
});

// Crear nuevo registro de bitácora
// ===============================================
// CORRECCIÓN COMPLETA PARA server.js
// Reemplaza TODA la función app.post('/api/bitacora')
// ===============================================

app.post('/api/bitacora', (req, res) => {
    const {
        id_trabajador,
        id_vehiculo,
        fecha,
        turno,
        tipo_registro,
        kilometros,  // NUEVO CAMPO
        acompanante,
        observaciones_generales,
        equipo,
        vehiculo_checks,
        combustible
    } = req.body;
    
    console.log('Datos recibidos:', {
        id_trabajador,
        id_vehiculo,
        fecha,
        turno,
        tipo_registro,
        kilometros,
        acompanante,
        observaciones_generales
    });
    
    if (!id_trabajador || !id_vehiculo || !fecha || !turno || !tipo_registro) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    
    // Iniciar transacción
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // 1. Insertar registro principal de bitácora CON KILÓMETROS
        const bitacoraQuery = `
            INSERT INTO bitacora_vehiculo 
            (id_trabajador, id_vehiculo, fecha, turno, tipo_registro, kilometros, acompanante, observaciones_generales) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const kilometrosValue = kilometros ? parseFloat(kilometros) : null;
        console.log('Insertando kilómetros:', kilometrosValue);
        
        db.run(bitacoraQuery, [
            id_trabajador, 
            id_vehiculo, 
            fecha, 
            turno, 
            tipo_registro, 
            kilometrosValue,
            acompanante,
            observaciones_generales
        ],  function(err) {
            if (err) {
                db.run('ROLLBACK');
                console.error('Error insertando bitácora:', err);
                return res.status(500).json({ error: 'Error del servidor insertando bitácora' });
            }
    
            const bitacoraId = this.lastID;
            console.log(`Registro ${bitacoraId} creado exitosamente con kilómetros: ${kilometrosValue}`);
            
            // Función auxiliar para completar la transacción
            const completarTransaccion = () => {
                db.run('COMMIT', (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        console.error('Error confirmando transacción:', err);
                        return res.status(500).json({ error: 'Error confirmando transacción' });
                    }
                    
                    console.log('Registro guardado exitosamente');
                    res.json({
                        message: 'Registro de bitácora guardado exitosamente',
                        id_bitacora: bitacoraId
                    });
                });
            };
            
            // 2. Insertar verificación de equipo (si existe)
            if (equipo && Object.keys(equipo).length > 0) {
                console.log('Insertando verificación de equipo...');
                const equipoQuery = `
                    INSERT INTO verificacion_equipo (
                        id_bitacora, pertiga, escalera_baja, escalera_media, detector_13_2kv,
                        puesta_tierra_jabalina, pinza_identar_hidraulica, aparejo, morzas_autoajustables,
                        barreta, ganchos, escafandra, boga_servicio, amperometrica,
                        rotafasimetro, linterna, herramientas_mano
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                db.run(equipoQuery, [
                    bitacoraId,
                    equipo.pertiga || false,
                    equipo.escalera_baja || false,
                    equipo.escalera_media || false,
                    equipo.detector_13_2kv || false,
                    equipo.puesta_tierra_jabalina || false,
                    equipo.pinza_identar_hidraulica || false,
                    equipo.aparejo || false,
                    equipo.morzas_autoajustables || false,
                    equipo.barreta || false,
                    equipo.ganchos || false,
                    equipo.escafandra || false,
                    equipo.boga_servicio || false,
                    equipo.amperometrica || false,
                    equipo.rotafasimetro || false,
                    equipo.linterna || false,
                    equipo.herramientas_mano || false
                ], (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Error insertando verificación de equipo' });
                    }
                    
                    console.log('Verificación de equipo insertada');
                    // Continuar con vehículo
                    insertarVerificacionVehiculo();
                });
            } else {
                // Sin equipo, continuar con vehículo
                insertarVerificacionVehiculo();
            }
            
            // 3. Función para insertar verificación de vehículo
            function insertarVerificacionVehiculo() {
                if (vehiculo_checks && Object.keys(vehiculo_checks).length > 0) {
                    console.log('Insertando verificación de vehículo...');
                    const vehiculoQuery = `
                        INSERT INTO verificacion_vehiculo (
                            id_bitacora, seguro, cedula_vehiculo, luces, balizas,
                            aceite, agua, liquido_freno, rodados_presion, matafueg,
                            auxilio_gato, conos_soga, botiquin
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    db.run(vehiculoQuery, [
                        bitacoraId,
                        vehiculo_checks.seguro || false,
                        vehiculo_checks.cedula_vehiculo || false,
                        vehiculo_checks.luces || false,
                        vehiculo_checks.balizas || false,
                        vehiculo_checks.aceite || false,
                        vehiculo_checks.agua || false,
                        vehiculo_checks.liquido_freno || false,
                        vehiculo_checks.rodados_presion || false,
                        vehiculo_checks.matafueg || false,
                        vehiculo_checks.auxilio_gato || false,
                        vehiculo_checks.conos_soga || false,
                        vehiculo_checks.botiquin || false
                    ], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Error insertando verificacion del vehiculo' });
                        }
                        
                        console.log('Verificación de vehículo insertada');
                        // Continuar con combustible
                        insertarCombustible();
                    });
                } else {
                    // Sin verificación de vehículo, continuar con combustible
                    insertarCombustible();
                }
            }
            
            // 4. Función para insertar combustible
            function insertarCombustible() {
                if (combustible && (combustible.carga_combustible || combustible.observaciones_combustible)) {
                    console.log('Insertando datos de combustible...');
                    const combustibleQuery = `
                        INSERT INTO combustible (id_bitacora, carga_combustible, observaciones_combustible) 
                        VALUES (?, ?, ?)
                    `;
                    
                    db.run(combustibleQuery, [
                        bitacoraId,
                        combustible.carga_combustible || null,
                        combustible.observaciones_combustible || null
                    ], (err) => {
                        if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Error insertando datos de combustible' });
                        }
                        
                        console.log('Datos de combustible insertados');
                        // Completar transacción
                        completarTransaccion();
                    });
                } else {
                    // Sin combustible, completar transacción
                    completarTransaccion();
                }
            }
        });
    });
});

// Obtener detalle completo de un registro
app.get('/api/bitacora/:id', (req, res) => {
    const bitacoraId = req.params.id;
    
    const query = `
        SELECT 
            b.*,
            t.nombre as trabajador_nombre,
            t.cedula as trabajador_cedula,
            v.placa,
            v.modelo,
            v.año,
            v.tipo_vehiculo,
            e.*,
            vv.*,
            c.carga_combustible,
            b.acompanante,
            b.kilometros, 
            c.observaciones_combustible
        FROM bitacora_vehiculo b
        JOIN trabajadores t ON b.id_trabajador = t.id_trabajador
        JOIN vehiculos v ON b.id_vehiculo = v.id_vehiculo
        LEFT JOIN verificacion_equipo e ON b.id_bitacora = e.id_bitacora
        LEFT JOIN verificacion_vehiculo vv ON b.id_bitacora = vv.id_bitacora
        LEFT JOIN combustible c ON b.id_bitacora = c.id_bitacora
        WHERE b.id_bitacora = ?
    `;
    
    db.get(query, [bitacoraId], (err, row) => {
        if (err) {
            console.error('Error obteniendo detalle:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
    
        if (!row) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
    
        res.json(row);
    });
});

// ===============================================
// MANEJO DE ERRORES Y SERVIDOR
// ===============================================

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Manejo de errores del servidor
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});



function crearTablasIniciales() {
    const tablas = [
        `CREATE TABLE IF NOT EXISTS trabajadores (
            id_trabajador INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            cedula TEXT UNIQUE NOT NULL,
            turno TEXT,
            activo INTEGER DEFAULT 1,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS vehiculos (
            id_vehiculo INTEGER PRIMARY KEY AUTOINCREMENT,
            placa TEXT UNIQUE NOT NULL,
            modelo TEXT,
            año INTEGER,
            tipo_vehiculo TEXT,
            activo INTEGER DEFAULT 1,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        `CREATE TABLE IF NOT EXISTS bitacora_vehiculo (
            id_bitacora INTEGER PRIMARY KEY AUTOINCREMENT,
            id_trabajador INTEGER NOT NULL,
            id_vehiculo INTEGER NOT NULL,
            fecha DATE NOT NULL,
            turno TEXT NOT NULL,
            tipo_registro TEXT NOT NULL,
            kilometros REAL,
            acompanante TEXT,
            observaciones_generales TEXT,
            fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (id_trabajador) REFERENCES trabajadores (id_trabajador),
            FOREIGN KEY (id_vehiculo) REFERENCES vehiculos (id_vehiculo)
        )`,
        
        `CREATE TABLE IF NOT EXISTS verificacion_equipo (
            id_verificacion INTEGER PRIMARY KEY AUTOINCREMENT,
            id_bitacora INTEGER NOT NULL,
            pertiga INTEGER DEFAULT 0,
            escalera_baja INTEGER DEFAULT 0,
            escalera_media INTEGER DEFAULT 0,
            detector_13_2kv INTEGER DEFAULT 0,
            puesta_tierra_jabalina INTEGER DEFAULT 0,
            pinza_identar_hidraulica INTEGER DEFAULT 0,
            aparejo INTEGER DEFAULT 0,
            morzas_autoajustables INTEGER DEFAULT 0,
            barreta INTEGER DEFAULT 0,
            ganchos INTEGER DEFAULT 0,
            escafandra INTEGER DEFAULT 0,
            boga_servicio INTEGER DEFAULT 0,
            amperometrica INTEGER DEFAULT 0,
            rotafasimetro INTEGER DEFAULT 0,
            linterna INTEGER DEFAULT 0,
            herramientas_mano INTEGER DEFAULT 0,
            FOREIGN KEY (id_bitacora) REFERENCES bitacora_vehiculo (id_bitacora)
        )`,
        
        `CREATE TABLE IF NOT EXISTS verificacion_vehiculo (
            id_verificacion INTEGER PRIMARY KEY AUTOINCREMENT,
            id_bitacora INTEGER NOT NULL,
            seguro INTEGER DEFAULT 0,
            cedula_vehiculo INTEGER DEFAULT 0,
            luces INTEGER DEFAULT 0,
            balizas INTEGER DEFAULT 0,
            aceite INTEGER DEFAULT 0,
            agua INTEGER DEFAULT 0,
            liquido_freno INTEGER DEFAULT 0,
            rodados_presion INTEGER DEFAULT 0,
            matafueg INTEGER DEFAULT 0,
            auxilio_gato INTEGER DEFAULT 0,
            conos_soga INTEGER DEFAULT 0,
            botiquin INTEGER DEFAULT 0,
            FOREIGN KEY (id_bitacora) REFERENCES bitacora_vehiculo (id_bitacora)
        )`,
        
        `CREATE TABLE IF NOT EXISTS combustible (
            id_combustible INTEGER PRIMARY KEY AUTOINCREMENT,
            id_bitacora INTEGER NOT NULL,
            carga_combustible REAL,
            observaciones_combustible TEXT,
            FOREIGN KEY (id_bitacora) REFERENCES bitacora_vehiculo (id_bitacora)
        )`
    ];
    
    tablas.forEach(tabla => {
        db.run(tabla, (err) => {
            if (err) {
                console.error('Error creando tabla:', err);
            }
        });
    });
}



// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});