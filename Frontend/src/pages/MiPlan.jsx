import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Notification from '../components/Notification';
import styles from './Styles/MiPlan.module.css';

const MiPlan = () => {
  const [loading, setLoading] = useState(true);
  const [planActivo, setPlanActivo] = useState(false);
  const [datosPlan, setDatosPlan] = useState(null);
  const [alerta, setAlerta] = useState(null);
  const [cargandoPago, setCargandoPago] = useState(false);

  const mostrarNotificacion = (mensaje, tipo) => {
    setAlerta({ mensaje, tipo });
  };

  const verificarPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      // CORREGIDO: Apunta a la ruta real del dashboard del cliente para validar el plan
      const respuesta = await fetch('http://localhost:5000/api/dashboard/cliente', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();

      if (respuesta.ok && datos.planActual && datos.planActual !== 'NINGUNO') {
        setPlanActivo(true);
        setDatosPlan(datos);
      } else {
        setPlanActivo(false);
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion('Error al conectar con el servidor.', 'error');
    } finally {
      loading && setLoading(false);
    }
  };

  useEffect(() => {
    verificarPlan();

    const queryParams = new URLSearchParams(window.location.search);
    const status = queryParams.get('payment');

    if (status === 'success') {
      mostrarNotificacion('¡Pago aprobado por PSE! Tu plan mensual se encuentra activo.', 'success');
    } else if (status === 'failure') {
      mostrarNotificacion('El pago a través de PSE fue rechazado o cancelado.', 'error');
    }
  }, []);

  const iniciarPagoRealPSE = async () => {
    setCargandoPago(true);
    try {
      const token = localStorage.getItem('token');
      // CORREGIDO: Redirige la creación del checkout a las rutas de pagos integradas
      const respuesta = await fetch('http://localhost:5000/api/payments/comprar-plan-mensual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const datos = await respuesta.json();

      if (respuesta.ok && datos.urlPago) {
        mostrarNotificacion('Conexión exitosa. Redirigiendo a la plataforma oficial de PSE...', 'success');
        
        setTimeout(() => {
          window.location.href = datos.urlPago;
        }, 1000);
      } else {
        mostrarNotificacion(datos.message || 'No se pudo generar el canal de pago PSE real.', 'error');
        setCargandoPago(false);
      }
    } catch (error) {
      console.error(error);
      mostrarNotificacion('Error crítico de conexión con la pasarela de pagos.', 'error');
      setCargandoPago(false);
    }
  };

  const formatearFecha = (fechaString) => {
    if (!fechaString || fechaString === 'N/A') return 'N/A';
    const fecha = new Date(fechaString);
    if(isNaN(fecha)) return fechaString;
    return `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <div className={styles.notificationContainer}>
        {alerta && <Notification mensaje={alerta.mensaje} tipo={alerta.tipo} onClose={() => setAlerta(null)} />}
      </div>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Mi Plan Mensual</h1>
          <p>Gestiona tu membresía y acceso al sistema inteligente de parqueadero</p>
        </header>

        {loading ? (
          <div className={styles.loading}>Verificando credenciales del sistema...</div>
        ) : planActivo ? (
          /* VISTA CUANDO EL CLIENTE SÍ TIENE EL PLAN ACTIVADO */
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div className={styles.planTitleContainer}>
                <div className={styles.iconContainer}>★</div>
                <div>
                  <h2>Plan Premium</h2>
                  <p className={styles.statusActive}>Estado: Activo ({datosPlan?.diasRestantes} días restantes)</p>
                </div>
              </div>
              <span className={styles.badgeActive}>Activo</span>
            </div>

            <div className={styles.planGrid}>
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>Vehículo Asignado</span>
                <span className={styles.infoValue}>{datosPlan?.placaVehiculo || 'Sin Placa'}</span>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>Vence el</span>
                <span className={styles.infoValue}>{formatearFecha(datosPlan?.validoHasta)}</span>
              </div>
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>Valor Mensualidad</span>
                <span className={styles.infoValue}>$180.000 COP</span>
              </div>
            </div>
          </div>
        ) : (
          /* VISTA DIRECTA DE COMPRA REAL */
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <div className={styles.planTitleContainer}>
                <h2>No tienes un plan activo</h2>
              </div>
            </div>
            
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>
              Adquiere tu mensualidad para disfrutar de acceso ilimitado a las celdas de AeroParking.
            </p>
            
            <div className={styles.planGrid} style={{ gridTemplateColumns: '1fr', marginBottom: '24px' }}>
              <div className={styles.infoBox}>
                <span className={styles.infoLabel}>PLAN MENSUAL</span>
                <h2 className={styles.infoValue} style={{ fontSize: '28px', color: '#00c6ff' }}>
                  $180.000 <span style={{ fontSize: '14px', color: '#64748b' }}>/ Mes</span>
                </h2>
              </div>
            </div>

            <div className={styles.actionsContainer}>
              <button 
                className={styles.btnPrimary} 
                onClick={iniciarPagoRealPSE}
                disabled={cargandoPago}
              >
                {cargandoPago ? 'Abriendo canal seguro...' : 'Pagar con PSE'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MiPlan;