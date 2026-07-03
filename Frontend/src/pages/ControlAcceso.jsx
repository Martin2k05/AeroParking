import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import Sidebar from '../components/Sidebar';
import styles from '../pages/Styles/ControlAcceso.module.css';

const ControlAcceso = () => {
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState('Automovil');
  const [lista, setLista] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [escanearAutomatico, setEscanearAutomatico] = useState(false);
  const [errorPlaca, setErrorPlaca] = useState('');
  const videoRef = useRef(null);

  // Validación individual por cada tipo específico de vehículo basado en la tabla oficial
  const validarFormatoPlaca = (valorPlaca, tipoVehiculo) => {
    const limpia = valorPlaca.replace(/[\s-]/g, '').toUpperCase();
    if (!limpia) return '';

    const regexParticular = /^[A-Z]{3}\d{3}$/;

    switch (tipoVehiculo) {
      case 'Automovil':
      case 'Campero':
      case 'Camioneta':
      case 'Microbus':
      case 'Motocarro':
        return regexParticular.test(limpia) ? '' : `Formato inválido para ${tipoVehiculo} (Ej: ABC123)`;
      
      case 'Motocicleta':
        const regexMoto = /^[A-Z]{3}\d{2}[A-Z]$/;
        return regexMoto.test(limpia) ? '' : 'Formato inválido para Motocicleta (Ej: ABC12D)';
      
      case 'Bicicleta':
        return limpia.length >= 2 ? '' : 'El ID de la bicicleta debe tener al menos 2 caracteres';
      
      default:
        return '';
    }
  };

  const cargarVehiculos = () => {
    fetch('http://localhost:5000/api/parking/activos', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => setLista(Array.isArray(data) ? data : []))
    .catch(err => { console.error(err); setLista([]); });
  };

  useEffect(() => {
    cargarVehiculos();
    const interval = setInterval(cargarVehiculos, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval;
    if (camaraAbierta && escanearAutomatico) {
      interval = setInterval(() => {
        capturarYEnviar();
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [camaraAbierta, escanearAutomatico]);

  useEffect(() => {
    setErrorPlaca(validarFormatoPlaca(placa, tipo));
  }, [placa, tipo]);

  const procesarConIA = async (canvas) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const formData = new FormData();
      formData.append('foto', blob, 'placa.jpg'); 

      try {
        const res = await fetch('http://localhost:5000/api/parking/leer-placa', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        
        const data = await res.json();
        if (res.ok && data.placa) {
          setPlaca(data.placa.toUpperCase());
          toast.success("Placa detectada: " + data.placa);
          cerrarCamara();
        }
      } catch (err) {
        console.error("Error crítico de conexión:", err);
      }
    }, 'image/jpeg', 0.8);
  };
  
  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCamaraAbierta(true);
      setEscanearAutomatico(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 500);
    } catch (err) { toast.error("No se pudo acceder a la cámara."); }
  };

  const cerrarCamara = () => {
    setEscanearAutomatico(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setCamaraAbierta(false);
  };

  const capturarYEnviar = () => {
    if (!videoRef.current || videoRef.current.readyState !== 4) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    procesarConIA(canvas);
  };

  const handleIngreso = async (e) => {
    e.preventDefault();
    const placaLimpia = placa.trim().toUpperCase().replace(/[\s-]/g, '');
    if(!placaLimpia) return;

    if (errorPlaca) {
      toast.error("Por favor, ingresa una placa con el formato correcto.");
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/parking/ingreso', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ placaVehiculo: placaLimpia, tipoVehiculo: tipo })
      });
      const data = await res.json();
      if(res.ok) { 
        setPlaca(''); 
        cargarVehiculos(); 
        toast.success(data.message); 
      } else { 
        toast.error(data.message || "Error al registrar"); 
      }
    } catch (error) { toast.error("Error de conexión con el servidor"); }
  };

  // NUEVO: Lógica modificada para validar si es cliente mensual y no cobrarle
  const handleSalida = async (placaSalida) => {
    try {
      const res = await fetch('http://localhost:5000/api/parking/salida', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ placaVehiculo: placaSalida })
      });
      
      const data = await res.json();
      
      if (res.ok) { 
        // Si el backend detecta que es mensual (por ejemplo data.esMensual === true o data.total === 0)
        if (data.esMensual || data.total === 0) {
          toast.success(`⭐️ Cliente Mensual Activo: Salida registrada sin cobro ($0) para la placa ${placaSalida}`);
        } else {
          // Cobro normal para un cliente ocasional
          toast.success(data.message || `Salida registrada. Total a cobrar: $${data.total}`);
        }
        cargarVehiculos(); 
      } else { 
        toast.error(data.message || "Error al registrar salida"); 
      }
    } catch (error) {
      toast.error("Error de conexión al procesar la salida");
    }
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.content}>
        <div className={styles.header}><h1>Control de Acceso</h1></div>
        <div className={styles.panel}>
          <h2>Registrar Ingreso</h2>
          <form onSubmit={handleIngreso} className={styles.formInline}>
            
            <div className={styles.inputGroup}>
              <input type="text" value={placa} onChange={e => setPlaca(e.target.value.toUpperCase())} placeholder="Placa / ID" />
            </div>

            <div className={styles.inputGroup}>
              <select 
                value={tipo} 
                onChange={e => setTipo(e.target.value)} 
                style={{ 
                  padding: '0 16px',
                  height: '48px',
                  borderRadius: '8px', 
                  backgroundColor: 'rgba(24, 33, 56, 0.4)', 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
                  width: '100%',
                  minWidth: '180px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
                }}
              >
                <option value="Automovil" style={{ background: '#141b2e', color: '#fff' }}>Automóvil</option>
                <option value="Campero" style={{ background: '#141b2e', color: '#fff' }}>Campero</option>
                <option value="Camioneta" style={{ background: '#141b2e', color: '#fff' }}>Camioneta</option>
                <option value="Microbus" style={{ background: '#141b2e', color: '#fff' }}>Microbús</option>
                <option value="Motocarro" style={{ background: '#141b2e', color: '#fff' }}>Motocarro</option>
                <option value="Motocicleta" style={{ background: '#141b2e', color: '#fff' }}>Motocicleta</option>
                <option value="Bicicleta" style={{ background: '#141b2e', color: '#fff' }}>Bicicleta</option>
              </select>
            </div>

            <button type="button" onClick={abrirCamara} className={styles.cameraBtn}>Escaneo IA Automático</button>
            <button type="submit" className={styles.submitBtn} disabled={!!errorPlaca || !placa.trim()}>Registrar</button>
          </form>

          {errorPlaca && (
            <p style={{ color: '#ff6b6b', fontSize: '14px', marginTop: '12px', fontWeight: '500', paddingLeft: '5px' }}>
              ⚠️ {errorPlaca}
            </p>
          )}
        </div>

        {camaraAbierta && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <video ref={videoRef} autoPlay playsInline style={{width: '100%', borderRadius: '10px'}} />
              <button onClick={cerrarCamara} className={styles.salidaBtn} style={{marginTop: '10px'}}>Detener Escaneo</button>
            </div>
          </div>
        )}

        <div className={styles.panel}>
          <h2>Vehículos en Parqueadero</h2>
          <input className={styles.searchBar} placeholder=" Buscar..." onChange={(e) => setBusqueda(e.target.value)} />
          <div className={styles.listaVehiculos}>
            {lista.filter(v => v.placa_vehiculo.toLowerCase().includes(busqueda.toLowerCase())).map((v, i) => (
              <div key={i} className={styles.itemVehiculo}>
                <div className={styles.vehiculoInfo}><h3>{v.placa_vehiculo}</h3><p>{v.tipo_vehiculo}</p></div>
                <button onClick={() => handleSalida(v.placa_vehiculo)} className={styles.salidaBtn}>Salida</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlAcceso;