import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, UserX, Edit3, Check, X } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import styles from '../Styles/GestionClientes.module.css';

const GestionClientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [editandoId, setEditandoId] = useState(null);
  const [nuevaPlaca, setNuevaPlaca] = useState('');

  const [notificacion, setNotificacion] = useState({ mostrar: false, mensaje: '', tipo: '' });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (user.rol !== 'Admin' && user.rol !== 'Administrador')) {
      navigate('/login');
    } else {
      cargarClientes();
    }
  }, [navigate]);

  const mostrarAlerta = (mensaje, tipo = 'success') => {
    setNotificacion({ mostrar: true, mensaje, tipo });
    setTimeout(() => {
      setNotificacion({ mostrar: false, mensaje: '', tipo: '' });
    }, 4000);
  };

  const cargarClientes = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:5000/api/admin/clientes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setClientes(datos);
      }
    } catch (error) {
      console.error('Error al mapear clientes:', error);
    }
  };

  const iniciarEdicion = (cliente) => {
    setEditandoId(cliente.id_cliente);
    setNuevaPlaca(cliente.placa_vehiculo || '');
  };

  const guardarPlaca = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:5000/api/admin/clientes/${id}/placa`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ placa_vehiculo: nuevaPlaca })
      });

      if (respuesta.ok) {
        setEditandoId(null);
        cargarClientes();
        mostrarAlerta('Placa actualizada con éxito en la base de datos.', 'success');
      } else {
        const err = await respuesta.json();
        mostrarAlerta(err.message || 'Error al actualizar la placa.', 'error');
      }
    } catch (error) {
      console.error('Error al guardar nueva placa:', error);
      mostrarAlerta('Error de conexión con el servidor.', 'error');
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente de forma permanente?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:5000/api/admin/clientes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (respuesta.ok) {
        cargarClientes();
        mostrarAlerta('Cliente eliminado correctamente.', 'success');
      } else {
        mostrarAlerta('No se pudo eliminar el cliente.', 'error');
      }
    } catch (error) {
      console.error('Error al borrar cliente:', error);
      mostrarAlerta('Error de conexión al eliminar.', 'error');
    }
  };

  const clientesFiltrados = clientes.filter(c => 
    c.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.identificacion?.includes(busqueda) ||
    (c.placa_vehiculo && c.placa_vehiculo.toLowerCase().includes(busqueda.toLowerCase()))
  );

  return (
    <div className={styles.dashboardContainer}>
      
      {notificacion.mostrar && (
        <div className={`${styles.toastNotification} ${notificacion.tipo === 'success' ? styles.toastSuccess : styles.toastError}`}>
          <span>{notificacion.mensaje}</span>
          <button 
            onClick={() => setNotificacion({ ...notificacion, mostrar: false })}
            className={styles.toastCloseButton}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <Sidebar />

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <h1>Gestión de Clientes</h1>
          <p>Administra los usuarios y vehículos registrados en el sistema</p>
        </header>

        <section className={styles.tableActions}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, cédula o placa..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </section>

        <section className={styles.tableContainer}>
          <table className={styles.customTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Identificación</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Placa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  <td>{cliente.id_cliente}</td>
                  <td className={styles.clientNameCell}>{cliente.nombre_cliente}</td>
                  <td>{cliente.identificacion}</td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.telefono || 'N/A'}</td>
                  <td className={styles.addressCell}>
                    {`${cliente.dir_calle || ''} ${cliente.dir_carrera || ''} ${cliente.dir_numero || ''} ${cliente.dir_barrio || ''}`.trim() || 'N/A'}
                  </td>
                  
                  <td>
                    {editandoId === cliente.id_cliente ? (
                      <input 
                        type="text"
                        value={nuevaPlaca}
                        onChange={(e) => setNuevaPlaca(e.target.value)}
                        className={styles.searchInputPlaca}
                      />
                    ) : (
                      <span className={cliente.placa_vehiculo ? styles.placaBadge : styles.noPlacaBadge}>
                        {cliente.placa_vehiculo || 'Sin Placa'}
                      </span>
                    )}
                  </td>

                  <td>
                    <div className={styles.actionsWrapper}>
                      {editandoId === cliente.id_cliente ? (
                        <button 
                          onClick={() => guardarPlaca(cliente.id_cliente)} 
                          className={styles.saveButtonRow}
                          title="Guardar Placa"
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => iniciarEdicion(cliente)} 
                          className={styles.editButtonRow}
                          title="Editar Placa"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => eliminarCliente(cliente.id_cliente)} 
                        className={styles.deleteButtonRow}
                        title="Eliminar Cliente"
                        disabled={editandoId === cliente.id_cliente}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {clientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan="8" className={styles.emptyTableState}>
                    <UserX size={32} />
                    <p>No se encontraron clientes registrados en el sistema.</p>
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

export default GestionClientes;