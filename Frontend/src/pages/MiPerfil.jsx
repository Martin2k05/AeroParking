import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { toast } from 'sonner';
import { User, Mail, Phone, Hash, Car, Lock, Key, RefreshCw, X, Shield, Eye, EyeOff } from 'lucide-react';
import styles from './Styles/MiPerfil.module.css';

const MiPerfil = () => {
  const [editando, setEditando] = useState(false);
  
  const [perfil, setPerfil] = useState({
    nombre_cliente: '',
    identificacion: '',
    correo: '',
    telefono: '',
    dir_calle: '',
    dir_carrera: '',
    dir_numero: '',
    dir_barrio: '',
    placa_vehiculo: ''
  });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ actual: '', nueva: '', confirmar: '' });
  
  const [verActual, setVerActual] = useState(false);
  const [verNueva, setVerNueva] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);

  useEffect(() => {
    const cargarDatosPerfil = async () => {
      try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch('http://localhost:5000/api/dashboard/perfil-cliente', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const datos = await respuesta.json();

        if (respuesta.ok) {
          // 🔥 FILTRO ESTRICTO DE TEXTO: Evita que "NULL" en string rompa el input
          let placaLimpia = datos.placa_vehiculo || datos.placa || datos.placaVehiculo || '';
          if (placaLimpia === 'NULL' || placaLimpia === 'null' || !placaLimpia) {
            // Intenta buscar el respaldo del usuario de la sesión antes de poner "Sin Placa"
            const usuarioSesion = JSON.parse(localStorage.getItem('user')) || {};
            placaLimpia = usuarioSesion.placa_vehiculo || 'Sin Placa';
          }

          setPerfil({
            nombre_cliente: datos.nombre_cliente || datos.nombre || datos.nombreCompleto || '',
            identificacion: datos.identificacion || datos.cedula || '',
            correo: datos.correo || datos.email || datos.correoElectronico || '',
            telefono: datos.telefono || datos.celular || datos.telefonoCelular || '',
            dir_calle: datos.dir_calle || datos.calle || datos.calle_av || '',
            dir_carrera: datos.dir_carrera || datos.carrera || '',
            dir_numero: datos.dir_numero || datos.numero || '',
            dir_barrio: datos.dir_barrio || datos.barrio || '',
            placa_vehiculo: placaLimpia
          });
        } else {
          toast.error('Error de perfil', { description: datos.message || 'Error al cargar perfil.' });
        }
      } catch (error) {
        console.error(error);
        toast.error('Error de servidor', { description: 'Error de conexión con el servidor.' });
      }
    };

    cargarDatosPerfil();
  }, []);

  const guardarCambiosPerfil = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/auth/actualizar-perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          correo: perfil.correo,
          telefono: perfil.telefono,
          dir_calle: perfil.dir_calle,
          dir_carrera: perfil.dir_carrera,
          dir_numero: perfil.dir_numero,
          dir_barrio: perfil.dir_barrio
        })
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        toast.success('¡Perfil actualizado!', { description: 'Información de perfil actualizada con éxito.' });
        setEditando(false);
      } else {
        toast.error('Error al guardar', { description: datos.message || 'Error al actualizar.' });
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de red', { description: 'No se pudo conectar con el servidor.' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, '');
      if (soloNumeros.length <= 10) {
        setPerfil({ ...perfil, [name]: soloNumeros });
      }
      return;
    }
    setPerfil({ ...perfil, [name]: value });
  };

  const guardarContrasena = async (e) => {
    e.preventDefault();
    if (passwordForm.nueva !== passwordForm.confirmar) {
      toast.error('Error de validación', { description: 'La nueva contraseña y la confirmación no coinciden.' });
      return;
    }

    try {
      const token = localStorage.getItem('token'); 
      const respuesta = await fetch('http://localhost:5000/api/auth/cambiar-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          password: passwordForm.actual, 
          nuevaContrasena: passwordForm.nueva 
        })
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        toast.success('Contraseña modificada', { description: datos.message || '¡Contraseña modificada correctamente!' });
        setModalAbierto(false);
        setPasswordForm({ actual: '', nueva: '', confirmar: '' });
        setVerActual(false);
        setVerNueva(false);
        setVerConfirmar(false);
      } else {
        toast.error('Error de seguridad', { description: datos.message || 'Hubo un error al actualizar.' });
      }
    } catch (error) {
      toast.error('Error de red', { description: 'No se pudo conectar con el servidor.' });
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1>Mi Perfil</h1>
            <p>Gestiona tu información personal en tiempo real</p>
          </div>
          <button 
            className={editando ? styles.btnSave : styles.btnEdit} 
            onClick={() => {
              if (editando) {
                guardarCambiosPerfil();
              } else {
                setEditando(true);
              }
            }}
          >
            {editando ? 'Guardar Cambios' : 'Editar Perfil'}
          </button>
        </header>

        <div className={styles.sectionsStack}>
          <section className={styles.card}>
            <h3>Información Personal</h3>
            <div className={styles.gridForm}>
              
              <div className={styles.inputGroup}>
                <label>Nombre Completo</label>
                <div className={styles.inputWrapper}>
                  <User size={18} className={styles.inputIcon} />
                  <input type="text" value={perfil.nombre_cliente} readOnly className={styles.inputBloqueado} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Correo Electrónico</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input 
                    type="email" 
                    name="correo"
                    value={perfil.correo} 
                    onChange={handleInputChange}
                    readOnly={!editando} 
                    className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Teléfono Celular</label>
                <div className={styles.inputWrapper}>
                  <Phone size={18} className={styles.inputIcon} />
                  <input 
                    type="text" 
                    name="telefono"
                    value={perfil.telefono} 
                    onChange={handleInputChange}
                    readOnly={!editando} 
                    className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Identificación</label>
                <div className={styles.inputWrapper}>
                  <Hash size={18} className={styles.inputIcon} />
                  <input type="text" value={perfil.identificacion} readOnly className={styles.inputBloqueado} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Placa del Vehículo</label>
                <div className={styles.inputWrapper}>
                  <Car size={18} className={styles.inputIcon} />
                  <input type="text" value={perfil.placa_vehiculo} readOnly className={styles.inputBloqueado} />
                </div>
              </div>

              <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
                <label>Dirección de Residencia</label>
                <div className={styles.direccionGrid}>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Calle / Av</span>
                    <input 
                      type="text" 
                      name="dir_calle" 
                      value={perfil.dir_calle} 
                      onChange={handleInputChange} 
                      placeholder="Calle / Av" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Carrera</span>
                    <input 
                      type="text" 
                      name="dir_carrera" 
                      value={perfil.dir_carrera} 
                      onChange={handleInputChange} 
                      placeholder="Carrera" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Número</span>
                    <input 
                      type="text" 
                      name="dir_numero" 
                      value={perfil.dir_numero} 
                      onChange={handleInputChange} 
                      placeholder="Número" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                  <div className={styles.subInputContainer}>
                    <span className={styles.inputLabelHint}>Barrio</span>
                    <input 
                      type="text" 
                      name="dir_barrio" 
                      value={perfil.dir_barrio} 
                      onChange={handleInputChange} 
                      placeholder="Barrio" 
                      readOnly={!editando}
                      className={editando ? styles.inputHabilitado : styles.inputBloqueado}
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.securityHeader}>
              <Shield size={20} className={styles.securityIcon} />
              <h3>Seguridad de la Cuenta</h3>
            </div>
            <button className={styles.btnPrimary} onClick={() => setModalAbierto(true)}>
              Cambiar Contraseña
            </button>
          </section>
        </div>
      </main>

      {/* MODAL */}
      {modalAbierto && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div>
                <h3>Modificar Contraseña</h3>
                <p className={styles.modalSubtitle}>Asegura el acceso a tu cuenta en AeroParking</p>
              </div>
              <button className={styles.btnCloseX} onClick={() => setModalAbierto(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={guardarContrasena} className={styles.modalForm}>
              <div className={styles.modalInputGroup}>
                <label>Contraseña Actual</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.modalInputIcon} />
                  <input 
                    type={verActual ? "text" : "password"} 
                    name="actual" 
                    placeholder="••••••••"
                    value={passwordForm.actual} 
                    onChange={(e) => setPasswordForm({...passwordForm, actual: e.target.value})} 
                    required 
                  />
                  <button 
                    type="button" 
                    className={styles.btnTogglePassword} 
                    onClick={() => setVerActual(!verActual)}
                  >
                    {verActual ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.modalInputGroup}>
                <label>Nueva Contraseña</label>
                <div className={styles.inputWrapper}>
                  <Key size={18} className={styles.modalInputIcon} />
                  <input 
                    type={verNueva ? "text" : "password"} 
                    name="nueva" 
                    placeholder="Mínimo 6 caracteres"
                    value={passwordForm.nueva} 
                    onChange={(e) => setPasswordForm({...passwordForm, nueva: e.target.value})} 
                    required 
                  />
                  <button 
                    type="button" 
                    className={styles.btnTogglePassword} 
                    onClick={() => setVerNueva(!verNueva)}
                  >
                    {verNueva ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.modalInputGroup}>
                <label>Confirmar Nueva Contraseña</label>
                <div className={styles.inputWrapper}>
                  <RefreshCw size={18} className={styles.modalInputIcon} />
                  <input 
                    type={verConfirmar ? "text" : "password"} 
                    name="confirmar" 
                    placeholder="Repite la nueva contraseña"
                    value={passwordForm.confirmar} 
                    onChange={(e) => setPasswordForm({...passwordForm, confirmar: e.target.value})} 
                    required 
                  />
                  <button 
                    type="button" 
                    className={styles.btnTogglePassword} 
                    onClick={() => setVerConfirmar(!verConfirmar)}
                  >
                    {verConfirmar ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.btnSecondary} onClick={() => setModalAbierto(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnModalSubmit}>
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiPerfil;