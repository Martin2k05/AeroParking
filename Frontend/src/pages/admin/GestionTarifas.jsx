import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Bike, ShieldAlert, Edit2, Check } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import styles from '../Styles/Tarifas.module.css';

const GestionTarifas = () => {
  const navigate = useNavigate();
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
      navigate('/login');
    } else {
      cargarTarifasDB();
    }
  }, [navigate]);

  const cargarTarifasDB = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/tarifas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      if (respuesta.ok && Array.isArray(datos)) {
        setTarifas(datos);
      }
    } catch (error) {
      console.error(error);
      mostrarAlerta('Error al conectar con la base de datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (idTarifa, campo, valor) => {
    setTarifas(prev => prev.map(t => t.id_tarifa === idTarifa ? { ...t, [campo]: Number(valor) } : t));
  };

  const guardarCambiosCategoría = async (ids) => {
    try {
      const token = localStorage.getItem('token');
      const promesas = ids.map(id => {
        const tarifa = tarifas.find(t => t.id_tarifa === id);
        return fetch(`http://localhost:5000/api/admin/tarifas/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(tarifa)
        });
      });

      const respuestas = await Promise.all(promesas);
      if (respuestas.every(r => r.ok)) {
        mostrarAlerta('Tarifas actualizadas correctamente en la base de datos', 'exito');
        setEditando(false);
        cargarTarifasDB();
      } else {
        mostrarAlerta('Ocurrió un error al actualizar algunas tarifas', 'error');
      }
    } catch (error) {
      mostrarAlerta('Error interno del sistema', 'error');
    }
  };

  const mostrarAlerta = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 4000);
  };

  // Filtrado por las 3 filas del Figma usando las IDs de tu base de datos semilla
  const catVehiculosGrandes = tarifas.filter(t => [1, 2, 3, 4, 5].includes(t.id_tarifa));
  const tarifaMoto = tarifas.find(t => t.id_tarifa === 6);
  const tarifaBici = tarifas.find(t => t.id_tarifa === 7);

  // Tomamos una de referencia para mostrar los valores en los inputs deshabilitados/habilitados
  const refGrande = catVehiculosGrandes[0] || { valor_primera_hora: 0, valor_hora_2_a_12: 0, valor_hora_13_a_168: 0, valor_hora_169_mas: 0 };

  const actualizarCamposGrupoGrandes = (campo, valor) => {
    setTarifas(prev => prev.map(t => [1, 2, 3, 4, 5].includes(t.id_tarifa) ? { ...t, [campo]: Number(valor) } : t));
  };

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1>Gestión de Tarifas</h1>
            <p>Configura los precios por categoría de vehículo</p>
          </div>
          <button 
            onClick={() => { if (editando) { cargarTarifasDB(); } setEditando(!editando); }} 
            className={`${styles.btnEditar} ${editando ? styles.btnCancel : ''}`}
          >
            {editando ? 'Cancelar Ajuste' : <><Edit2 size={16} /> Editar Tarifas</>}
          </button>
        </header>

        {mensaje.texto && (
          <div className={`${styles.alerta} ${mensaje.tipo === 'error' ? styles.alertaError : styles.alertaExito}`}>
            <span>{mensaje.texto}</span>
          </div>
        )}

        {loading ? (
          <div className={styles.loading}>Conectando con la base de datos...</div>
        ) : (
          <div className={styles.categoriesStack}>
            
            {/* CATEGORÍA 1: VEHÍCULOS GRANDES */}
            <div className={styles.categoryRow}>
              <div className={styles.rowInfo}>
                <div className={`${styles.iconContainer} ${styles.blueIcon}`}>
                  <Car size={20} />
                </div>
                <div>
                  <h3>Categoría 1</h3>
                  <p>Automóviles, Camperos, Camionetas, Microbuses, Motocarros</p>
                </div>
                {editando && (
                  <button onClick={() => guardarCambiosCategoría([1,2,3,4,5])} className={styles.btnSaveRow} title="Guardar esta categoría">
                    <Check size={16} />
                  </button>
                )}
              </div>
              <div className={styles.inputsGrid}>
                <div className={styles.inputBox}>
                  <label>1 Hora</label>
                  <input 
                    type="number" 
                    disabled={!editando} 
                    value={refGrande.valor_primera_hora} 
                    onChange={(e) => actualizarCamposGrupoGrandes('valor_primera_hora', e.target.value)}
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>2 a 12 Horas</label>
                  <input 
                    type="number" 
                    disabled={!editando} 
                    value={refGrande.valor_hora_2_a_12} 
                    onChange={(e) => actualizarCamposGrupoGrandes('valor_hora_2_a_12', e.target.value)}
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>13 a 168 Horas (7 días)</label>
                  <input 
                    type="number" 
                    disabled={!editando} 
                    value={refGrande.valor_hora_13_a_168} 
                    onChange={(e) => actualizarCamposGrupoGrandes('valor_hora_13_a_168', e.target.value)}
                  />
                </div>
                <div className={styles.inputBox}>
                  <label>169 Horas o Más</label>
                  <input 
                    type="number" 
                    disabled={!editando} 
                    value={refGrande.valor_hora_169_mas} 
                    onChange={(e) => actualizarCamposGrupoGrandes('valor_hora_169_mas', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* CATEGORÍA 2: MOTOCICLETAS */}
            {tarifaMoto && (
              <div className={styles.categoryRow}>
                <div className={styles.rowInfo}>
                  <div className={`${styles.iconContainer} ${styles.purpleIcon}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M7.5 13h9M13 13l2-5h2M9 13l1.5-3.5"/></svg>
                  </div>
                  <div>
                    <h3>Categoría 2</h3>
                    <p>Motocicletas</p>
                  </div>
                  {editando && (
                    <button onClick={() => guardarCambiosCategoría([6])} className={styles.btnSaveRow}>
                      <Check size={16} />
                    </button>
                  )}
                </div>
                <div className={styles.inputsGrid}>
                  <div className={styles.inputBox}>
                    <label>1 Hora</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaMoto.valor_primera_hora} 
                      onChange={(e) => handleInputChange(6, 'valor_primera_hora', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>2 a 12 Horas</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaMoto.valor_hora_2_a_12} 
                      onChange={(e) => handleInputChange(6, 'valor_hora_2_a_12', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>13 a 168 Horas (7 días)</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaMoto.valor_hora_13_a_168} 
                      onChange={(e) => handleInputChange(6, 'valor_hora_13_a_168', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>169 Horas o Más</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaMoto.valor_hora_169_mas} 
                      onChange={(e) => handleInputChange(6, 'valor_hora_169_mas', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CATEGORÍA 3: BICICLETAS */}
            {tarifaBici && (
              <div className={styles.categoryRow}>
                <div className={styles.rowInfo}>
                  <div className={`${styles.iconContainer} ${styles.greenIcon}`}>
                    <Bike size={20} />
                  </div>
                  <div>
                    <h3>Categoría 3</h3>
                    <p>Bicicletas</p>
                  </div>
                  {editando && (
                    <button onClick={() => guardarCambiosCategoría([7])} className={styles.btnSaveRow}>
                      <Check size={16} />
                    </button>
                  )}
                </div>
                <div className={styles.inputsGrid}>
                  <div className={styles.inputBox}>
                    <label>1 Hora</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaBici.valor_primera_hora} 
                      onChange={(e) => handleInputChange(7, 'valor_primera_hora', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>2 a 12 Horas</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaBici.valor_hora_2_a_12} 
                      onChange={(e) => handleInputChange(7, 'valor_hora_2_a_12', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>13 a 168 Horas (7 días)</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaBici.valor_hora_13_a_168} 
                      onChange={(e) => handleInputChange(7, 'valor_hora_13_a_168', e.target.value)}
                    />
                  </div>
                  <div className={styles.inputBox}>
                    <label>169 Horas o Más</label>
                    <input 
                      type="number" 
                      disabled={!editando} 
                      value={tarifaBici.valor_hora_169_mas} 
                      onChange={(e) => handleInputChange(7, 'valor_hora_169_mas', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PANEL DE INFORMACIÓN BAJO */}
            <footer className={styles.infoFooter}>
              <h4>Información sobre las categorías</h4>
              <ul>
                <li><span className={styles.blueTxt}>Categoría 1:</span> Vehículos grandes - Automóviles, Camperos, Camionetas, Microbuses, Motocarros</li>
                <li><span className={styles.purpleTxt}>Categoría 2:</span> Vehículos medianos - Motocicletas</li>
                <li><span className={styles.greenTxt}>Categoría 3:</span> Vehículos pequeños - Bicicletas</li>
              </ul>
            </footer>

          </div>
        )}
      </main>
    </div>
  );
};

export default GestionTarifas;