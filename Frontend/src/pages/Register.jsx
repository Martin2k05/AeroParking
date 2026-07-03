import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plane, User, Hash, Mail, Phone, Car, Lock, ArrowLeft } from 'lucide-react';
import styles from './Styles/Register.module.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    identificacion: '',
    correo: '',
    telefono: '',
    calle: '',
    carrera: '',
    numero: '',
    barrio: '',
    placaVehiculo: '', // Asegurado match con el name del input
    contrasena: '',
    confirmarContrasena: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'identificacion' || name === 'telefono') {
      const soloNumeros = value.replace(/\D/g, ''); 
      if (soloNumeros.length <= 10) {
        setFormData({ ...formData, [name]: soloNumeros });
      }
      return;
    }

    // Transformar placa automáticamente a mayúsculas y quitar espacios
    if (name === 'placaVehiculo') {
      const placaFormateada = value.toUpperCase().replace(/\s/g, '');
      if (placaFormateada.length <= 6) {
        setFormData({ ...formData, [name]: placaFormateada });
      }
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.contrasena !== formData.confirmarContrasena) {
      toast.error('Error de validación', { description: 'Las contraseñas no coinciden.' });
      return;
    }

    if (formData.identificacion.length < 5) {
      toast.error('Error de validación', { description: 'La identificación debe tener al menos 5 dígitos.' });
      return;
    }

    // VALIDACIÓN DE PLACA (Formatos: AAA111 o AAA11A)
    const regexPlaca = /^[A-Z]{3}[0-9]{2}[0-9A-Z]$/;
    if (formData.placaVehiculo && !regexPlaca.test(formData.placaVehiculo)) {
      toast.error('Error de formato', { 
        description: 'La placa debe ser de 3 letras y 3 números (AAA111) o 3 letras, 2 números y una letra (AAA11A).' 
      });
      return;
    }

    try {
      const respuesta = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const datos = await respuesta.json();

      if (respuesta.ok) {
        toast.success('¡Registro exitoso!', { description: datos.message || 'Cuenta creada correctamente.' });
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        toast.error('Error en registro', { description: datos.message || 'Error al registrar la cuenta.' });
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red', { description: 'No se pudo conectar con el servidor.' });
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.logoIcon}>
          <Plane size={24} color="white" className={styles.lucideIcon} />
        </div>
        <h2>Registro de Cliente</h2>
        <p className={styles.subtitle}>Activa tu plan mensual de parqueadero</p>

        <form onSubmit={handleSubmit} className={styles.formGrid}>
          
          <div className={styles.inputGroup}>
            <label>Nombre Completo</label>
            <div className={styles.inputWrapper}>
              <User size={16} className={styles.fieldIcon} />
              <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Identificación (Máx 10 dígitos)</label>
            <div className={styles.inputWrapper}>
              <Hash size={16} className={styles.fieldIcon} />
              <input type="text" name="identificacion" value={formData.identificacion} onChange={handleChange} placeholder="Ej: 12345678" required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Correo Electrónico</label>
            <div className={styles.inputWrapper}>
              <Mail size={16} className={styles.fieldIcon} />
              <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="correo@ejemplo.com" required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Teléfono Celular</label>
            <div className={styles.inputWrapper}>
              <Phone size={16} className={styles.fieldIcon} />
              <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="Ej: 3151234567" required />
            </div>
          </div>

          <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
            <label>Dirección de Residencia</label>
            <div className={styles.direccionGrid}>
              <div className={styles.subInputContainer}>
                <span className={styles.inputLabelHint}>Calle / Av</span>
                <input type="text" name="calle" value={formData.calle} onChange={handleChange} placeholder="Ej: 12" required />
              </div>
              <div className={styles.subInputContainer}>
                <span className={styles.inputLabelHint}>Carrera</span>
                <input type="text" name="carrera" value={formData.carrera} onChange={handleChange} placeholder="Ej: 23" required />
              </div>
              <div className={styles.subInputContainer}>
                <span className={styles.inputLabelHint}>Número</span>
                <input type="text" name="numero" value={formData.numero} onChange={handleChange} placeholder="Ej: 2" required />
              </div>
              <div className={styles.subInputContainer}>
                <span className={styles.inputLabelHint}>Barrio</span>
                <input type="text" name="barrio" value={formData.barrio} onChange={handleChange} placeholder="Ej: Olímpico" required />
              </div>
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Placa del Vehículo</label>
            <div className={styles.inputWrapper}>
              <Car size={16} className={styles.fieldIcon} />
              <input type="text" name="placaVehiculo" value={formData.placaVehiculo} onChange={handleChange} placeholder="Ej: ABC123" required />
            </div>
          </div>

          <div className={styles.spacer}></div>

          <div className={styles.inputGroup}>
            <label>Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.fieldIcon} />
              <input type="password" name="contrasena" value={formData.contrasena} onChange={handleChange} placeholder="••••••••" required />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Confirmar Contraseña</label>
            <div className={styles.inputWrapper}>
              <Lock size={16} className={styles.fieldIcon} />
              <input type="password" name="confirmarContrasena" value={formData.confirmarContrasena} onChange={handleChange} placeholder="••••••••" required />
            </div>
          </div>

          <div className={`${styles.formActions} ${styles.fullWidth}`}>
            <button type="button" className={styles.btnVolver} onClick={() => navigate('/login')}>
              <ArrowLeft size={16} style={{ marginRight: '8px' }} />
              Volver
            </button>
            <button type="submit" className={styles.btnRegistrar}>
              Registrar Cuenta
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Register;