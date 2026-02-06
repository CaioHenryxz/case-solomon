import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AUTH_TOKEN = "meu-token-secreto-123";

// Formatação de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [metrics, setMetrics] = useState([]);
  
  // Estados de Login
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('123');
  
  // Filtros
  const [status, setStatus] = useState(''); // O filtro de Status
  const [method, setMethod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleLogin = async () => {
    try {
      const res = await axios.post('http://localhost:5001/login', { email, password });
      if (res.data.token) setIsLoggedIn(true);
    } catch (err) { alert("Acesso negado."); }
  };

  const loadData = async () => {
    try {
      // Busca dados do backend (filtrados por data e metodo)
      const res = await axios.get(`http://localhost:8081/metrics?method=${method}&start=${startDate}&end=${endDate}`, {
        headers: { 'Authorization': AUTH_TOKEN }
      });
      setMetrics(res.data || []);
    } catch (err) { console.error("Erro na comunicação com servidor."); }
  };

  const handleSync = async () => {
    try {
      await axios.post('http://localhost:5001/sync', {}, { headers: { 'Authorization': AUTH_TOKEN } });
      alert("Dados sincronizados com sucesso!");
      loadData();
    } catch (err) { alert("Falha na sincronização."); }
  };

  useEffect(() => { if (isLoggedIn) loadData(); }, [isLoggedIn, method, startDate, endDate]);

  // --- LÓGICA DO GRÁFICO (Obedece Status + Agrupa Data) ---
  const chartData = useMemo(() => {
    if (!metrics.length) return [];

    // 1. Filtra visualmente pelo Status selecionado
    const filtered = status 
      ? metrics.filter(m => m.status === status) 
      : metrics;

    // 2. Agrupa por Data
    const grouped = filtered.reduce((acc, curr) => {
      const dateKey = curr.date; 
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, total_value: 0, total_count: 0 };
      }
      acc[dateKey].total_value += Number(curr.total_value) || 0;
      acc[dateKey].total_count += Number(curr.total_count) || 0;
      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [metrics, status]);

  // --- LÓGICA DOS CARDS (AGORA OBEDECE AO FILTRO DE STATUS) ---
  // ... resto do código ...

  // NOVA LÓGICA: Se houver um filtro de status selecionado (ex: 'approved')
  // e o card atual não for desse status (ex: 'pending'), ele retorna ZERO.
  const getAggregated = (targetStatus, type) => {
    // 1. Verifica se o filtro global 'status' está ativo e se é diferente do card atual
    if (status && status !== targetStatus) {
       return type === 'value' ? '0,00' : 0;
    }

    // 2. Se for o status selecionado (ou se não tiver filtro), calcula normalmente
    const filtered = metrics.filter(m => m.status === targetStatus);
    
    if (type === 'value') {
      const total = filtered.reduce((acc, cur) => acc + (Number(cur.total_value) || 0), 0);
      return total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    return filtered.reduce((acc, cur) => acc + (Number(cur.total_count) || 0), 0);
  };

  // ... resto do código ...

  if (!isLoggedIn) {
    return (
      <div style={emeraldLoginContainer}>
        <div style={emeraldLoginBox}>
          <div style={{ marginBottom: '15px', fontSize: '45px' }}>💹</div>
          <h1 style={{ color: '#064e3b', margin: '0 0 5px 0', fontSize: '30px', fontWeight: '800' }}>Solomon</h1>
          <p style={{ color: '#374151', marginBottom: '35px', fontWeight: '500' }}>Inteligência Financeira</p>
          <input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail profissional" style={emeraldInput} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" style={emeraldInput} />
          <button onClick={handleLogin} style={emeraldLoginButton}>Acessar Plataforma</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: '"Inter", sans-serif', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '45px' }}>
        <div>
          <h2 style={{ color: '#064e3b', fontSize: '32px', fontWeight: '800', margin: 0 }}>Dashboard Solomon</h2>
          <div style={{ width: '60px', height: '5px', backgroundColor: '#10b981', marginTop: '8px', borderRadius: '10px' }}></div>
        </div>
        <button onClick={handleSync} style={emeraldSyncButton}>Sincronizar Agora</button>
      </header>

      {/* ÁREA DE FILTROS */}
      <div style={filterContainerSlate}>
        <div style={filterGroupSlate}>
          <label style={filterLabelSlate}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={slateInput}>
            <option value="">Visualizar Todos</option>
            <option value="approved">Aprovados</option>
            <option value="pending">Pendentes</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
        <div style={filterGroupSlate}>
          <label style={filterLabelSlate}>Metodologia</label>
          <select value={method} onChange={e => setMethod(e.target.value)} style={slateInput}>
            <option value="">Todas as formas</option>
            <option value="pix">Pix</option>
            <option value="boleto">Boleto</option>
            <option value="credit_card">Cartão de Crédito</option>
          </select>
        </div>
        <div style={filterGroupSlate}>
          <label style={filterLabelSlate}>Data Inicial</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={slateInput} />
        </div>
        <div style={filterGroupSlate}>
          <label style={filterLabelSlate}>Data Final</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={slateInput} />
        </div>
      </div>

      {/* CARDS DE RESUMO (Agora zeram se não baterem com o filtro) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <div style={{...cardBase, borderLeft: '6px solid #22c55e'}}>
          <h4 style={cardTitle}>Receita Aprovada</h4>
          <p style={{...valStyle, color: '#16a34a'}}>R$ {getAggregated('approved', 'value')}</p>
        </div>
        <div style={{...cardBase, borderLeft: '6px solid #eab308'}}>
          <h4 style={cardTitle}>Receita Pendente</h4>
          <p style={{...valStyle, color: '#ca8a04'}}>R$ {getAggregated('pending', 'value')}</p>
        </div>
        <div style={{...cardBase, borderLeft: '6px solid #ef4444'}}>
          <h4 style={cardTitle}>Receita Cancelada</h4>
          <p style={{...valStyle, color: '#dc2626'}}>R$ {getAggregated('cancelled', 'value')}</p>
        </div>
        
        <div style={{...cardBase, borderBottom: '4px solid #22c55e'}}>
          <h4 style={cardTitle}>Pedidos Aprovados</h4>
          <p style={{...countStyle, color: '#16a34a'}}>{getAggregated('approved', 'count')} un</p>
        </div>
        <div style={{...cardBase, borderBottom: '4px solid #eab308'}}>
          <h4 style={cardTitle}>Pedidos Pendentes</h4>
          <p style={{...countStyle, color: '#ca8a04'}}>{getAggregated('pending', 'count')} un</p>
        </div>
        <div style={{...cardBase, borderBottom: '4px solid #ef4444'}}>
          <h4 style={cardTitle}>Pedidos Cancelados</h4>
          <p style={{...countStyle, color: '#dc2626'}}>{getAggregated('cancelled', 'count')} un</p>
        </div>
      </div>

      {/* GRÁFICO */}
      <div style={chartWrapper}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tickFormatter={(str) => {
                const parts = str.split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}` : str;
              }}
              axisLine={false} 
              tick={{fill: '#64748b', fontSize: 12}}
            />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#6366f1', fontSize: 12}} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#f59e0b', fontSize: 12}} />
            <Tooltip 
              formatter={(value, name) => [
                name.includes('Receita') ? formatCurrency(value) : value, 
                name
              ]}
              labelFormatter={(label) => {
                const parts = label.split('-');
                return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : label;
              }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
            />
            <Legend verticalAlign="top" align="right" iconType="circle" />
            <Line yAxisId="left" type="monotone" dataKey="total_value" stroke="#6366f1" name="Receita" strokeWidth={4} dot={false} activeDot={{ r: 8 }} />
            <Line yAxisId="right" type="monotone" dataKey="total_count" stroke="#f59e0b" name="Pedidos" strokeWidth={4} dot={false} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ESTILOS (Mantidos 100% como solicitado)
const emeraldLoginContainer = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'radial-gradient(circle, #065f46 0%, #064e3b 100%)', fontFamily: '"Inter", sans-serif' };
const emeraldLoginBox = { padding: '60px', backgroundColor: '#ffffff', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', width: '400px' };
const emeraldInput = { width: '100%', padding: '18px', marginBottom: '20px', borderRadius: '16px', border: '2px solid #e5e7eb', fontSize: '16px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f9fafb', transition: '0.3s' };
const emeraldLoginButton = { width: '100%', padding: '18px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '16px', cursor: 'pointer', fontSize: '16px', fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)' };
const emeraldSyncButton = { padding: '16px 32px', backgroundColor: '#064e3b', color: 'white', border: 'none', borderRadius: '18px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 10px 15px -3px rgba(6, 78, 59, 0.3)' };
const filterContainerSlate = { display: 'flex', gap: '40px', marginBottom: '45px', backgroundColor: '#1e293b', padding: '35px', borderRadius: '28px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' };
const filterGroupSlate = { display: 'flex', flexDirection: 'column', gap: '12px' };
const filterLabelSlate = { fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px' };
const slateInput = { padding: '16px', borderRadius: '14px', border: '1px solid #334155', backgroundColor: '#334155', color: '#f8fafc', fontSize: '15px', minWidth: '240px', cursor: 'pointer', outline: 'none' };
const cardBase = { backgroundColor: 'white', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'left' };
const cardTitle = { color: '#64748b', margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600' };
const valStyle = { fontSize: '24px', fontWeight: '800', margin: 0 };
const countStyle = { fontSize: '24px', fontWeight: '800', margin: 0 };
const chartWrapper = { width: '100%', height: '450px', backgroundColor: 'white', padding: '32px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', boxSizing: 'border-box' };