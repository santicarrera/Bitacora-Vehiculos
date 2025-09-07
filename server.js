// ===============================================
// SERVER.JS - SERVIDOR PRINCIPAL NODE.JS
// ===============================================

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Para servir archivos estáticos

// Configuración de la base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // Cambia por tu usuario de MySQL
    password: '',          // Cambia por tu contraseña de MySQL
    database: 'bitacora_vehiculos'
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        process.exit(1);
    }
    console.log('✅ Conectado a MySQL exitosamente');
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

// Obtener todos los trabajadores
app.get('/api/trabajadores', (req, res) => {
    const query = 'SELECT * FROM trabajadores WHERE activo = TRUE ORDER BY nombre';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo trabajadores:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// Agregar nuevo trabajador
app.post('/api/trabajadores', (req, res) => {
    const { nombre, cedula, turno } = req.body;
    
    if (!nombre || !cedula || !turno) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    
    const query = 'INSERT INTO trabajadores (nombre, cedula, turno) VALUES (?, ?, ?)';
    
    db.query(query, [nombre, cedula, turno], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Ya existe un trabajador con esa cédula' });
            }
            console.error('Error agregando trabajador:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        res.json({
            message: 'Trabajador agregado exitosamente',
            id: result.insertId
        });
    });
});

// ===============================================
// VEHÍCULOS
// ===============================================

// Obtener todos los vehículos
app.get('/api/vehiculos', (req, res) => {
    const query = 'SELECT * FROM vehiculos WHERE activo = TRUE ORDER BY placa';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error obteniendo vehículos:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// Agregar nuevo vehículo
app.post('/api/vehiculos', (req, res) => {
    const { placa, modelo, año, tipo_vehiculo } = req.body;
    
    if (!placa) {
        return res.status(400).json({ error: 'La placa es obligatoria' });
    }
    
    const query = 'INSERT INTO vehiculos (placa, modelo, año, tipo_vehiculo) VALUES (?, ?, ?, ?)';
    
    db.query(query, [placa, modelo || null, año || null, tipo_vehiculo || null], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Ya existe un vehículo con esa placa' });
            }
            console.error('Error agregando vehículo:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        res.json({
            message: 'Vehículo agregado exitosamente',
            id: result.insertId
        });
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
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error obteniendo registros:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        res.json(results);
    });
});

// Crear nuevo registro de bitácora
app.post('/api/bitacora', (req, res) => {
    const {
        id_trabajador,
        id_vehiculo,
        fecha,
        turno,
        tipo_registro,
        observaciones_generales,
        equipo,
        vehiculo_checks,
        combustible
    } = req.body;
    
    if (!id_trabajador || !id_vehiculo || !fecha || !turno || !tipo_registro) {
        return res.status(400).json({ error: 'Faltan datos obligatorios' });
    }
    
    // Iniciar transacción
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error iniciando transacción:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        // 1. Insertar registro principal de bitácora
        const bitacoraQuery = `
            INSERT INTO bitacora_vehiculo 
            (id_trabajador, id_vehiculo, fecha, turno, tipo_registro, observaciones_generales) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.query(bitacoraQuery, [id_trabajador, id_vehiculo, fecha, turno, tipo_registro, observaciones_generales], (err, result) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error insertando bitácora:', err);
                    res.status(500).json({ error: 'Error del servidor' });
                });
            }
            
            const bitacoraId = result.insertId;
            
            // 2. Insertar verificación de equipo
            if (equipo) {
                const equipoQuery = `
                    INSERT INTO verificacion_equipo (
                        id_bitacora, pertiga, escalera_baja, escalera_media, detector_13_2kv,
                        puesta_tierra_jabalina, pinza_identar_hidraulica, aparejo, morzas_autoajustables,
                        barreta, ganchos, escafandra, boga_servicio, amperometrica,
                        rotafasimetro, linterna, herramientas_mano
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                
                db.query(equipoQuery, [
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
                        return db.rollback(() => {
                            console.error('Error insertando equipo:', err);
                            res.status(500).json({ error: 'Error del servidor' });
                        });
                    }
                    
                    // 3. Insertar verificación de vehículo
                    if (vehiculo_checks) {
                        const vehiculoQuery = `
                            INSERT INTO verificacion_vehiculo (
                                id_bitacora, seguro, cedula_vehiculo, luces, balizas,
                                aceite, agua, liquido_freno, rodados_presion, matafueg,
                                auxilio_gato, conos_soga, botiquin
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        
                        db.query(vehiculoQuery, [
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
                                return db.rollback(() => {
                                    console.error('Error insertando verificación vehículo:', err);
                                    res.status(500).json({ error: 'Error del servidor' });
                                });
                            }
                            
                            // 4. Insertar datos de combustible (si existen)
                            if (combustible && (combustible.carga_combustible || combustible.observaciones_combustible)) {
                                const combustibleQuery = `
                                    INSERT INTO combustible (id_bitacora, carga_combustible, observaciones_combustible) 
                                    VALUES (?, ?, ?)
                                `;
                                
                                db.query(combustibleQuery, [
                                    bitacoraId,
                                    combustible.carga_combustible || null,
                                    combustible.observaciones_combustible || null
                                ], (err) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            console.error('Error insertando combustible:', err);
                                            res.status(500).json({ error: 'Error del servidor' });
                                        });
                                    }
                                    
                                    // Confirmar transacción
                                    db.commit((err) => {
                                        if (err) {
                                            return db.rollback(() => {
                                                console.error('Error confirmando transacción:', err);
                                                res.status(500).json({ error: 'Error del servidor' });
                                            });
                                        }
                                        
                                        res.json({
                                            message: 'Registro de bitácora guardado exitosamente',
                                            id_bitacora: bitacoraId
                                        });
                                    });
                                });
                            } else {
                                // Confirmar transacción sin combustible
                                db.commit((err) => {
                                    if (err) {
                                        return db.rollback(() => {
                                            console.error('Error confirmando transacción:', err);
                                            res.status(500).json({ error: 'Error del servidor' });
                                        });
                                    }
                                    
                                    res.json({
                                        message: 'Registro de bitácora guardado exitosamente',
                                        id_bitacora: bitacoraId
                                    });
                                });
                            }
                        });
                    } else {
                        // Sin verificación de vehículo, ir directo al commit
                        db.commit((err) => {
                            if (err) {
                                return db.rollback(() => {
                                    console.error('Error confirmando transacción:', err);
                                    res.status(500).json({ error: 'Error del servidor' });
                                });
                            }
                            
                            res.json({
                                message: 'Registro de bitácora guardado exitosamente',
                                id_bitacora: bitacoraId
                            });
                        });
                    }
                });
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
            c.observaciones_combustible
        FROM bitacora_vehiculo b
        JOIN trabajadores t ON b.id_trabajador = t.id_trabajador
        JOIN vehiculos v ON b.id_vehiculo = v.id_vehiculo
        LEFT JOIN verificacion_equipo e ON b.id_bitacora = e.id_bitacora
        LEFT JOIN verificacion_vehiculo vv ON b.id_bitacora = vv.id_bitacora
        LEFT JOIN combustible c ON b.id_bitacora = c.id_bitacora
        WHERE b.id_bitacora = ?
    `;
    
    db.query(query, [bitacoraId], (err, results) => {
        if (err) {
            console.error('Error obteniendo detalle:', err);
            return res.status(500).json({ error: 'Error del servidor' });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }
        
        res.json(results[0]);
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
});