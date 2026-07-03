import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, BarChart3, TrendingUp, Users, Car, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../../components/Sidebar';
import styles from '../Styles/Reportes.module.css';

const Reportes = () => {
  const navigate = useNavigate();
  
  const [tipoFiltro, setTipoFiltro] = useState('hoy');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const [metricas, setMetricas] = useState({
    totalCupos: 100,
    ocupados: 0,
    disponibles: 100,
    ingresosHoy: 0,
    clientesActivos: 0,
    planesPorVencer: 0
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [datosIngresos, setDatosIngresos] = useState([]);
  const [loading, setLoading] = useState(true);

  const COLORES_PIE = ['#3b82f6', '#a855f7', '#10b981'];

  useEffect(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    if (tipoFiltro === 'hoy') {
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
    } else if (tipoFiltro === 'ayer') {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      setFechaInicio(ayer.toISOString().split('T')[0]);
      setFechaFin(ayer.toISOString().split('T')[0]);
    } else if (tipoFiltro === 'semana') {
      const haceSieteDias = new Date();
      haceSieteDias.setDate(haceSieteDias.getDate() - 7);
      setFechaInicio(haceSieteDias.toISOString().split('T')[0]);
      setFechaFin(hoyStr);
    }
  }, [tipoFiltro]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
      navigate('/login');
    } else {
      cargarDataRealDashboard();
    }
  }, [navigate, fechaInicio, fechaFin]);

  const cargarDataRealDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `http://localhost:5000/api/admin/dashboard/metricas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&tipoFiltro=${tipoFiltro}`;
      
      const respuesta = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      
      if (respuesta.ok) {
        if (datos.metricas) setMetricas(datos.metricas);
        if (Array.isArray(datos.actividadReciente)) setActividadReciente(datos.actividadReciente);
        
        if (Array.isArray(datos.graficoIngresos)) {
          const mapeadoSemanales = datos.graficoIngresos.map(item => ({
            name: item.dia || 'S/D',
            ingresos: parseFloat(item.total) || 0
          }));
          setDatosIngresos(mapeadoSemanales);
        }
      }
    } catch (error) {
      console.error('Error al conectar con las métricas reales:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularDistribucionVehiculos = () => {
    if (!actividadReciente || actividadReciente.length === 0) {
      return [
        { name: 'Automóviles', value: 0 },
        { name: 'Motocicletas', value: 0 },
        { name: 'Bicicletas', value: 0 }
      ];
    }

    let carros = 0;
    let motos = 0;
    let bicis = 0;

    actividadReciente.forEach(v => {
      const tipo = v.tipo_vehiculo 
        ? v.tipo_vehiculo.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        : '';

      if (['automovil', 'campero', 'camioneta', 'microbus', 'motocarro', 'vehiculo'].includes(tipo)) {
        carros++;
      } else if (['motocicleta', 'moto'].includes(tipo)) {
        motos++;
      } else if (['bicicleta', 'bici'].includes(tipo)) {
        bicis++;
      }
    });

    const total = carros + motos + bicis;
    if (total === 0) {
      return [
        { name: 'Automóviles', value: 0 },
        { name: 'Motocicletas', value: 0 },
        { name: 'Bicicletas', value: 0 }
      ];
    }

    return [
      { name: 'Automóviles', value: Math.round((carros / total) * 100) },
      { name: 'Motocicletas', value: Math.round((motos / total) * 100) },
      { name: 'Bicicletas', value: Math.round((bicis / total) * 100) }
    ];
  };

  const handleExportarPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Encabezado Principal
    doc.setFillColor(11, 19, 43);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('AEROPARKING - REPORTE DE GESTIÓN', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sistema Inteligente de Control de Parqueaderos', 14, 25);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-CO')}`, 14, 31);

    // Filtros e información de rango
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Filtro Seleccionado: ${(tipoFiltro || 'hoy').toUpperCase()}`, 14, 48);
    doc.setFont('helvetica', 'normal');
    doc.text(`Rango de Evaluación: [${fechaInicio}] hasta [${fechaFin}]`, 14, 54);

    // ---- TARJETAS KPI (CORREGIDAS PARA MÁXIMA LEGIBILIDAD) ----
    doc.setDrawColor(218, 226, 237);
    
    // Tarjeta 1: Recaudo
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 62, 85, 22, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('RECAUDO EN EL PERIODO', 18, 68);
    doc.setFontSize(15);
    doc.setTextColor(29, 78, 216);
    doc.text(formatCOP(metricas.ingresosHoy || 0), 18, 78);

    // Tarjeta 2: Ocupación (Fondo claro e indicaciones legibles)
    doc.setFillColor(248, 250, 252);
    doc.rect(111, 62, 85, 22, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('OCUPACIÓN DE BAHÍAS', 115, 68);
    doc.setFontSize(15);
    doc.setTextColor(126, 34, 206);
    doc.text(`${metricas.ocupados || 0} / ${metricas.totalCupos || 100} Vehículos`, 115, 78);

    // Distribución de Flota
    doc.setTextColor(11, 19, 43);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Distribución de Tipos de Vehículos', 14, 96);
    
    const datosVehiculos = calcularDistribucionVehiculos();
    let inicialY = 104;
    datosVehiculos.forEach((v) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      doc.text(`• ${v.name}:`, 18, inicialY);
      doc.setFont('helvetica', 'bold');
      doc.text(`${v.value || 0}%`, 50, inicialY);
      inicialY += 6;
    });

    // Tabla de Historial
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(11, 19, 43);
    doc.text('Muestreo de Actividad y Operaciones', 14, 132);

    const columnasTabla = ['Placa', 'Tipo', 'Hora Ingreso', 'Hora Salida', 'Tarifa'];
    const filasTabla = (actividadReciente || []).map(v => [
      v.placa_vehiculo ? v.placa_vehiculo.toUpperCase() : '---',
      v.tipo_vehiculo || 'Automóvil',
      v.hora_ingreso ? new Date(v.hora_ingreso).toLocaleString('es-CO') : '-',
      v.hora_salida ? new Date(v.hora_salida).toLocaleString('es-CO') : 'Dentro',
      formatCOP(v.calculo_tarifa || 0)
    ]);

    autoTable(doc, {
      startY: 138,
      head: [columnasTabla],
      body: filasTabla,
      theme: 'grid',
      headStyles: { 
        fillColor: [28, 37, 65], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold' 
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 3 
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        4: { halign: 'right' }
      },
      didParseCell: (data) => {
        if(data.section === 'body' && data.column.index === 0) {
          data.cell.styles.textColor = [37, 99, 235];
        }
      }
    });

    doc.save(`Reporte_Aeroparking_${fechaInicio}_al_${fechaFin}.pdf`);
  };

  const formatCOP = (valor) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
  };

  const datosVehiculos = calcularDistribucionVehiculos();

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <Sidebar />
        <main className={styles.mainContent}>
          <header className={styles.header}>
            <h1>Cargando Analítica...</h1>
          </header>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div>
            <h1>Reportes y Analítica</h1>
            <p>Estadísticas y análisis del parqueadero en tiempo real</p>
          </div>
          
          <div className={styles.filterAndActionsArea}>
            <div className={styles.filterContainer}>
              <Calendar size={16} className={styles.calendarIcon} />
              <select 
                value={tipoFiltro} 
                onChange={(e) => setTipoFiltro(e.target.value)}
                className={styles.selectFiltro}
              >
                <option value="hoy">Hoy</option>
                <option value="ayer">Ayer</option>
                <option value="semana">Últimos 7 días</option>
                <option value="personalizado">Rango Personalizado</option>
              </select>
            </div>

            {tipoFiltro === 'personalizado' && (
              <div className={styles.customDateWrapper}>
                <input 
                  type="date" 
                  value={fechaInicio} 
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className={styles.inputFecha}
                />
                <span className={styles.rangoTexto}>a</span>
                <input 
                  type="date" 
                  value={fechaFin} 
                  onChange={(e) => setFechaFin(e.target.value)}
                  className={styles.inputFecha}
                />
              </div>
            )}

            <button onClick={handleExportarPDF} className={styles.btnExportar}>
              <Download size={18} /> Exportar PDF
            </button>
          </div>
        </header>

        <section className={styles.kpiGrid}>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.blue}`}>
              <TrendingUp size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Ingresos Recaudados</span>
              <h2>{formatCOP(metricas.ingresosHoy || 0)}</h2>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.pink}`}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Cupos Ocupados</span>
              <h2>{metricas.ocupados} / {metricas.totalCupos}</h2>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.green}`}>
              <Users size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Total Clientes</span>
              <h2>{metricas.clientesActivos}</h2>
            </div>
          </div>

          <div className={styles.kpiCard}>
            <div className={`${styles.kpiIcon} ${styles.orange}`}>
              <Car size={20} />
            </div>
            <div className={styles.kpiInfo}>
              <span>Cupos Disponibles</span>
              <h2>{metricas.disponibles}</h2>
            </div>
          </div>
        </section>

        <section className={styles.chartsGrid}>
          <div className={styles.chartWrapper}>
            <h3>Ingresos por Día</h3>
            <div className={styles.barChartContainer}>
              {datosIngresos && datosIngresos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosIngresos} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a3454" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" tickLine={false} dx={-5} allowDecimals={false} />
                    <Tooltip formatter={(value) => formatCOP(value)} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Ingresos (COP)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChartMessage}>
                  Sin datos de ingresos en este periodo
                </div>
              )}
            </div>
          </div>

          <div className={styles.chartWrapper}>
            <h3>Distribución por Tipo de Vehículo</h3>
            <div className={styles.pieChartContainer}>
              {datosVehiculos && datosVehiculos.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosVehiculos}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {datosVehiculos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      formatter={(value, entry) => (
                        <span className={styles.legendTextFormat}>{value} {entry.payload.value}%</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.emptyChartMessage}>
                  No hay vehículos registrados para calcular distribución
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={styles.tableContainer}>
          <h3>Historial de Vehículos Recientes</h3>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>Placa</th>
                <th>Tipo</th>
                <th>Hora Ingreso</th>
                <th>Hora Salida</th>
                <th>Tarifa Cobrada</th>
                <th className={styles.tableHeaderCenter}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {actividadReciente.map((vehiculo, idx) => (
                <tr key={idx}>
                  <td className={styles.placaText}>{vehiculo.placa_vehiculo}</td>
                  <td>{vehiculo.tipo_vehiculo || 'Automóvil'}</td>
                  <td>{vehiculo.hora_ingreso ? new Date(vehiculo.hora_ingreso).toLocaleString('es-CO') : '-'}</td>
                  <td>{vehiculo.hora_salida ? new Date(vehiculo.hora_salida).toLocaleString('es-CO') : '-'}</td>
                  <td>{formatCOP(vehiculo.calculo_tarifa || 0)}</td>
                  <td className={styles.tableCellCenter}>
                    <span className={vehiculo.hora_salida ? styles.badgeSalio : styles.badgeDentro}>
                      {vehiculo.hora_salida ? 'Salida' : 'Dentro'}
                    </span>
                  </td>
                </tr>
              ))}
              
              {actividadReciente.length === 0 && (
                <tr>
                  <td colSpan="6" className={styles.emptyTableMessage}>
                    No hay registros de ingresos o salidas en el rango seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default Reportes;