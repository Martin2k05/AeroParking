import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import styles from '../Styles/GestionOperadores.module.css';

const GestionOperadores = () => {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    correo: '',
    contrasena: '',
    id_rol: 2
  });

  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const API_URL = 'http://localhost:5000/api';

  const obtenerToken = () => localStorage.getItem('token');

  useEffect(() => {
    obtenerOperadores();
  }, []);

  const obtenerOperadores = async () => {
    try {
      const token = obtenerToken();
      const response = await fetch(`${API_URL}/admin/operadores`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }); 

      if (response.ok) {
        const data = await response.json();
        setOperadores(data);
      }
    } catch (error) {
      console.error('Error al obtener operadores:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ texto: '', tipo: '' });

    try {
      const response = await fetch(`${API_URL}/auth/register-operador`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.status === 201) {
        setMensaje({ texto: data.message || 'Operador creado correctamente.', tipo: 'success' });
        setFormData({ nombre_usuario: '', correo: '', contrasena: '', id_rol: 2 });
        obtenerOperadores();
      } else {
        setMensaje({ texto: data.message || 'Error al registrar.', tipo: 'error' });
      }
    } catch (error) {
      setMensaje({ texto: 'Error de conexión con el servidor.', tipo: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const eliminarOperador = async (id_usuario) => {
    if (window.confirm('¿Seguro que deseas eliminar este operador?')) {
      try {
        const token = obtenerToken();
        const response = await fetch(`${API_URL}/admin/operadores/${id_usuario}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          obtenerOperadores();
        }
      } catch (error) {
        console.error('Error al eliminar operador:', error);
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#090f24' }}>
      <Sidebar />
      <div style={{ flex: 1, overflowX: 'hidden' }} className={styles.dashboardContainer}>
        <div className={styles.mainContent}>
          <div className={styles.header}>
            <div>
              <h1>Gestión de Operadores</h1>
              <p>Registra o elimina cuentas de operarios del parqueadero.</p>
            </div>
          </div>

          {mensaje.texto && (
            <div className={`${styles.alert} ${mensaje.tipo === 'success' ? styles.alertSuccess : styles.alertError}`}>
              {mensaje.texto}
            </div>
          )}

          <div className={styles.sectionWrapper}>
            <h3>Registrar Nuevo Operador</h3>
            <form onSubmit={handleSubmit} className={styles.formGrid}>
              <div className={styles.inputGroup}>
                <label>Nombre de Usuario</label>
                <input
                  type="text"
                  name="nombre_usuario"
                  value={formData.nombre_usuario}
                  onChange={handleInputChange}
                  placeholder="Ej: OperadorSena"
                  required
                  className={styles.inputField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  placeholder="correo@parqueadero.com"
                  required
                  className={styles.inputField}
                />
              </div>

              <div className={styles.inputGroup}>
                <label>Contraseña</label>
                <input
                  type="password"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleInputChange}
                  placeholder="******"
                  required
                  className={styles.inputField}
                />
              </div>

              <div className={styles.btnFormWrapper}>
                <button type="submit" disabled={loading} className={styles.btnSubmit}>
                  {loading ? 'Registrando...' : 'Registrar Operador'}
                </button>
              </div>
            </form>
          </div>

          <div className={styles.tableContainer}>
            <h3>Operadores Registrados</h3>
            <table className={styles.customTable}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th className={styles.tableHeaderCenter}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {operadores.length === 0 ? (
                  <tr>
                    <td colSpan="3" className={styles.emptyTableMessage}>No hay operadores registrados actualmente.</td>
                  </tr>
                ) : (
                  operadores.map((op) => (
                    <tr key={op.id_usuario}>
                      <td className={styles.usuarioText}>{op.nombre_usuario}</td>
                      <td>{op.correo}</td>
                      <td className={styles.tableCellCenter}>
                        <div className={styles.actionsWrapper}>
                          <button 
                            onClick={() => eliminarOperador(op.id_usuario)}
                            className={`${styles.btnAction} ${styles.btnEliminar}`}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionOperadores;