import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plane } from 'lucide-react';
import styles from './Styles/Login.module.css';

const Login = () => {
  const [formData, setFormData] = useState({ correo: '', contrasena: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error en login');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('¡Ingreso exitoso!', {
        description: `Bienvenido de nuevo, ${data.user.nombre}.`
      });

      // Redirección condicional según el rol detectado
      if (data.user.rol === 'Admin') {
        navigate('/admin/dashboard');
      } else if (data.user.rol === 'Cliente') {
        navigate('/dashboard-cliente');
      } else {
        navigate('/dashboard-monitoreo');
      }
    } catch (err) {
      toast.error('Error de autenticación', {
        description: err.message
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <div className={styles.iconWrapper}>
          <div className={styles.icon}>
            <Plane size={32} color="white" className={styles.lucideIcon} />
          </div>
        </div>

        <h2 className={styles.title}>AeroParking</h2>
        <p className={styles.subtitle}>Sistema Inteligente de Gestión</p>

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Correo Electrónico</label>
            <input type="email" required placeholder="usuario@ejemplo.com" onChange={e => setFormData({...formData, correo: e.target.value})} />
          </div>

          <div className={styles.formGroup}>
            <label>Contraseña</label>
            <input type="password" required placeholder="••••••••" onChange={e => setFormData({...formData, contrasena: e.target.value})} />
          </div>

          <button type="submit" className={styles.submitBtn}>
            Ingresar al Sistema
          </button>
        </form>

        <div className={styles.linkWrapper}>
          <Link to="/register" className={styles.link}>¿No tienes cuenta? Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;