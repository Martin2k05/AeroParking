// ClienteDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { CreditCard, Calendar, Car, AlertTriangle } from 'lucide-react';
import styles from './Styles/ClienteDashboard.module.css';

const ClienteDashboard = () => {
  const navigate = useNavigate();
  
  const usuarioLocal = JSON.parse(localStorage.getItem('user')) || {};
  
  let placaInicial = (usuarioLocal.placa_vehiculo || usuarioLocal.placa || '').toString().trim();
  if (placaInicial === 'NULL' || placaInicial === 'null' || placaInicial === '') {
    placaInicial = 'No Registrada';
  }

  const [data, setData] = useState({ 
    planActual: 'NINGUNO', 
    diasRestantes: 0, 
    placaVehiculo: placaInicial, 
    validoHasta: 'N/A' 
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/dashboard/cliente', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(resData => {
      let placaAPI = resData.placaVehiculo || resData.placa_veh_culo;
      
      if (placaAPI) {
        placaAPI = placaAPI.toString().trim();
      }

      if (!placaAPI || placaAPI === 'NULL' || placaAPI === 'null' || placaAPI === '' || placaAPI.length < 3) {
        placaAPI = placaInicial;
      }

      setData({
        planActual: resData.planActual || 'NINGUNO',
        diasRestantes: resData.diasRestantes || 0,
        placaVehiculo: placaAPI, 
        validoHasta: resData.validoHasta || 'N/A'
      });
    })
    .catch(err => {
      console.error('Error en fetch dashboard:', err);
      setData(prev => ({
        ...prev,
        placaVehiculo: placaInicial
      }));
    });
  }, [placaInicial]);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <h1>Bienvenido, {usuarioLocal?.nombre || 'Cliente'}</h1>
        <p>Estado de tu plan mensual</p>

        <div className={styles.grid}>
          {/* CARD 1: PLAN ACTUAL */}
          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.bgBlue}`}>
              <CreditCard size={24} className={styles.lucideIcon} />
            </div>
            <h2>{data.planActual}</h2>
            <p className={styles.label}>Plan Actual</p>
            <p className={styles.footer}>
              {data.planActual !== 'NINGUNO' 
                ? `Activo hasta: ${data.validoHasta}` 
                : 'Sin suscripción vigente'}
            </p>
          </div>

          {/* CARD 2: DÍAS RESTANTES */}
          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.bgPink}`}>
              <Calendar size={24} className={styles.lucideIcon} />
            </div>
            <h2>{data.diasRestantes}</h2>
            <p className={styles.label}>Días Restantes</p>
            <p className={styles.footer}>Días de cobertura en celdas</p>
          </div>

          {/* CARD 3: MI VEHÍCULO */}
          <div className={styles.card}>
            <div className={`${styles.iconBox} ${styles.bgGreen}`}>
              <Car size={24} className={styles.lucideIcon} />
            </div>
            <h2>{data.placaVehiculo}</h2>
            <p className={styles.label}>Mi Vehículo</p>
            <p className={styles.footer}>Placa registrada</p>
          </div>
        </div>

        {/* VALIDACIÓN: SI NO TIENE PLAN ACTIVO MUESTRA EL BANNER DE ADVERTENCIA MEJORADO */}
        {data.planActual === 'NINGUNO' && (
          <div className={styles.alertBanner}>
            <div className={styles.alertLeft}>
              <div className={styles.alertIconContainer}>
                <AlertTriangle size={24} />
              </div>
              <div className={styles.alertContent}>
                <h4>Adquiere un plan mensual</h4>
                <p>
                  No tienes una suscripción activa. Adquiere tu mensualidad para disfrutar de acceso ilimitado a las celdas de AeroParking.
                </p>
              </div>
            </div>
            <button 
              className={styles.btnRenew} 
              onClick={() => navigate('/mi-plan')}
            >
              Ir a pagar mi plan con PSE
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClienteDashboard;