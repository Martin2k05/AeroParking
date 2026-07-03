import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner'; 
import Login from './pages/Login';
import Register from './pages/Register';
import ClienteDashboard from './pages/ClienteDashboard';
import OperarioDashboard from './pages/OperarioDashboard';
import ControlAcceso from './pages/ControlAcceso';
import ProtectedRoute from './components/ProtectedRoute';

// Importación de las páginas del cliente
import MiPlan from './pages/MiPlan';
import MiPerfil from './pages/MiPerfil';

// Importación de las páginas reales del Administrador
import AdminDashboard from './pages/admin/AdminDashboard';
import GestionClientes from './pages/admin/GestionClientes';
import GestionOperadores from './pages/admin/GestionOperadores'; // 🚀 AQUÍ: Nueva página de operarios
import Reportes from './pages/admin/Reportes';
import GestionTarifas from './pages/admin/GestionTarifas';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas de Clientes */}
        <Route path="/dashboard-cliente" element={
          <ProtectedRoute rolesPermitidos={['Cliente']}>
            <ClienteDashboard />
          </ProtectedRoute>
        } />
        <Route path="/mi-plan" element={
          <ProtectedRoute rolesPermitidos={['Cliente']}>
            <MiPlan />
          </ProtectedRoute>
        } />
        <Route path="/mi-perfil" element={
          <ProtectedRoute rolesPermitidos={['Cliente']}>
            <MiPerfil />
          </ProtectedRoute>
        } />

        {/* Rutas de Operarios y Administradores */}
        <Route path="/dashboard-monitoreo" element={
          <ProtectedRoute rolesPermitidos={['Operario', 'Admin']}>
            <OperarioDashboard />
          </ProtectedRoute>
        } />

        <Route path="/control-acceso" element={
          <ProtectedRoute rolesPermitidos={['Operario', 'Admin']}>
            <ControlAcceso />
          </ProtectedRoute>
        } />

        {/* Rutas exclusivas de Administradores */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/operadores" element={ // 🚀 AQUÍ: Mapeamos la ruta para que no te saque al login
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <GestionOperadores />
          </ProtectedRoute>
        } />
        <Route path="/admin/clientes" element={
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <GestionClientes />
          </ProtectedRoute>
        } />
        <Route path="/admin/reportes" element={
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <Reportes />
          </ProtectedRoute>
        } />
        <Route path="/admin/tarifas" element={
          <ProtectedRoute rolesPermitidos={['Admin']}>
            <GestionTarifas />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;