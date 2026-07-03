import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const GraficoIngresos = ({ data }) => {
  // 🔍 ESTO NOS VA A DECIR LA VERDAD EN LA CONSOLA (F12)
  console.log("👉 Datos que le llegan al Gráfico desde el Dashboard:", data);

  // Mapeo ultra seguro por si acaso
  const datosLimpios = Array.isArray(data) ? data.map(item => {
    // Si viene ingresos, o total, o si no, le inventamos un 15 si es hoy Miércoles para probar
    let valorSincronizado = 0;
    if (item.ingresos !== undefined) valorSincronizado = item.ingresos;
    else if (item.total !== undefined) valorSincronizado = item.total;

    return {
      ...item,
      total: Math.max(0, valorSincronizado)
    };
  }) : [];

  return (
    <div style={{ width: '100%', height: 300, backgroundColor: '#ffffff', padding: '10px', borderRadius: '10px' }}>
      <ResponsiveContainer>
        <LineChart data={datosLimpios}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="dia" stroke="#64748b" />
          <YAxis stroke="#64748b" domain={[0, 'auto']} allowDecimals={false} />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="#2563eb" 
            strokeWidth={3} 
            dot={{ r: 4 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GraficoIngresos;