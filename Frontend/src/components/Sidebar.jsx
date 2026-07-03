import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  DollarSign, 
  ShieldAlert, 
  LogOut, 
  CreditCard, 
  User,
  Wrench // Ícono para la gestión de operarios
} from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user')) || { nombre: 'Usuario', rol: 'Cliente' };

  const isAdmin = user.rol === 'Admin' || user.rol === 'Administrador';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getBadgeClass = () => {
    if (isAdmin) return styles.badgeAdmin;
    if (user.rol === 'Operario') return styles.badgeOperario;
    return styles.badgeCliente;
  };

  return (
    <div className={styles.sidebar}>
      <div>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </div>
          <div className={styles.logoText}>
            <h1>AeroParking</h1>
            <p>Sistema Inteligente</p>
          </div>
        </div>

        <div className={styles.userCard}>
          <p>Usuario activo</p>
          <h2>{user.nombre}</h2>
          <span className={`${styles.badge} ${getBadgeClass()}`}>{user.rol}</span>
        </div>

        <nav className={styles.menu}>
          {/* VISTAS EXCLUSIVAS DE CLIENTES */}
          {user.rol === 'Cliente' && (
            <>
              <button 
                onClick={() => navigate('/dashboard-cliente')} 
                className={location.pathname === '/dashboard-cliente' ? styles.menuBtnActive : styles.menuBtn}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button 
                onClick={() => navigate('/mi-plan')} 
                className={location.pathname === '/mi-plan' ? styles.menuBtnActive : styles.menuBtn}
              >
                <CreditCard size={18} /> Mi Plan
              </button>
              <button 
                onClick={() => navigate('/mi-perfil')} 
                className={location.pathname === '/mi-perfil' ? styles.menuBtnActive : styles.menuBtn}
              >
                <User size={18} /> Mi Perfil
              </button>
            </>
          )}

          {/* VISTAS ACCESIBLES POR OPERARIO O ADMINISTRADOR */}
          {(user.rol === 'Operario' || isAdmin) && (
            <>
              <button 
                onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard-monitoreo')} 
                className={(location.pathname === '/admin/dashboard' || location.pathname === '/dashboard-monitoreo') ? styles.menuBtnActive : styles.menuBtn}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button 
                onClick={() => navigate('/control-acceso')} 
                className={location.pathname === '/control-acceso' ? styles.menuBtnActive : styles.menuBtn}
              >
                <ShieldAlert size={18} /> Control de Acceso
              </button>
            </>
          )}

          {/* CONTROL EXCLUSIVO DEL ADMINISTRADOR */}
          {isAdmin && (
            <>
              <button 
                onClick={() => navigate('/admin/operadores')} 
                className={location.pathname === '/admin/operadores' ? styles.menuBtnActive : styles.menuBtn}
              >
                <Wrench size={18} /> Operadores
              </button>
              <button 
                onClick={() => navigate('/admin/clientes')} 
                className={location.pathname === '/admin/clientes' ? styles.menuBtnActive : styles.menuBtn}
              >
                <Users size={18} /> Clientes
              </button>
              <button 
                onClick={() => navigate('/admin/reportes')} 
                className={location.pathname === '/admin/reportes' ? styles.menuBtnActive : styles.menuBtn}
              >
                <FileText size={18} /> Reportes
              </button>
              <button 
                onClick={() => navigate('/admin/tarifas')} 
                className={location.pathname === '/admin/tarifas' ? styles.menuBtnActive : styles.menuBtn}
              >
                <DollarSign size={18} /> Tarifas
              </button>
            </>
          )}
        </nav>
      </div>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        <LogOut size={18} /> Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;