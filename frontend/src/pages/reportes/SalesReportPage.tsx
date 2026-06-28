import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, formatNumber, cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, DollarSign, ShoppingCart, Calendar,
  Download, FileDown, FileText, FileSpreadsheet, ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { exportSalesReportToCsv, exportSalesReportToExcel, exportSalesReportToPdf, buildExportFilename } from '@/lib/exportUtils';
import type { ApiResponse } from '@/types';

const RANGE_OPTIONS = [
  { label: 'Hoy', days: 0 },
  { label: 'Esta semana', days: 7 },
  { label: 'Este mes', days: 30 },
  { label: 'Trimestre', days: 90 },
  { label: 'Personalizado', days: -1 },
];

export default function SalesReportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [range, setRange] = useState(30);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateTo = new Date();
  const dateFrom = new Date();
  if (range > 0) dateFrom.setDate(dateFrom.getDate() - range);

  const fromStr = range === -1 ? customFrom : dateFrom.toISOString().split('T')[0];
  const toStr = range === -1 ? customTo : dateTo.toISOString().split('T')[0];

  const { data, isLoading } = useQuery({
    queryKey: ['sales-report', user?.companyId, fromStr, toStr],
    queryFn: () =>
      api.get<ApiResponse<any>>('/reports/sales', {
        params: { companyId: user?.companyId, dateFrom: fromStr, dateTo: toStr },
      }),
    enabled: !!user?.companyId && !!fromStr && !!toStr,
  });

  const report = data?.data?.data;
  const dailyData = report?.dailyBreakdown || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/reportes')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Ventas por período</h1>
            <p className="text-surface-500 text-sm">
              {fromStr} — {toStr}
            </p>
          </div>
        </div>
        <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-secondary"
            >
              <FileDown size={16} /> Exportar
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1e1e3a] border border-surface-200 dark:border-surface-700 rounded-xl shadow-soft z-50 py-1 animate-fade-in">
                <button
                  onClick={() => { handleExport('pdf'); setExportOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <FileText size={16} className="text-red-500" />
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => { handleExport('excel'); setExportOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <FileSpreadsheet size={16} className="text-green-600" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => { handleExport('csv'); setExportOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <Download size={16} className="text-blue-500" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>
      </div>

      {/* Range selector */}
      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          {RANGE_OPTIONS.map(opt => (
            <button key={opt.days} onClick={() => setRange(opt.days)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
                range === opt.days
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700')}>
              {opt.label}
            </button>
          ))}
          {range === -1 && (
            <div className="flex items-center gap-2 ml-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="input w-40" />
              <span className="text-surface-400">—</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="input w-40" />
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total ventas', value: formatCurrency(report?.totalSales || 0), icon: DollarSign, color: 'text-accent-500', bg: 'bg-accent-50' },
          { label: 'Transacciones', value: formatNumber(report?.totalTransactions || 0), icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Ticket promedio', value: formatCurrency(report?.averageTicket || 0), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon size={20} className={s.color} /></div>
            </div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{s.value}</p>
            <p className="text-sm text-surface-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Ventas diarias</h3>
        <div className="h-72">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} stroke="#868e96" fontSize={12} />
                <YAxis stroke="#868e96" fontSize={12} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e9ecef',
                    borderRadius: '12px',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  labelFormatter={d => new Date(d).toLocaleDateString('es-CO')}
                />
                <Bar dataKey="total" fill="#818cf8" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-surface-400">Sin datos para el período</div>
          )}
        </div>
      </div>

      {/* Recent sales table */}
      <div className="card">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800">
          <h3 className="font-semibold">Ventas recientes</h3>
        </div>
        <div className="table-container border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Subtotal</th>
                <th>IVA</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {report?.recentSales?.length > 0 ? report.recentSales.map((s: any) => (
                <tr key={s.id}>
                  <td className="font-mono text-sm">{s.saleNumber}</td>
                  <td className="text-sm">{formatDate(s.createdAt)}</td>
                  <td>{s.customer?.name || 'CF'}</td>
                  <td>{formatCurrency(s.subtotal)}</td>
                  <td>{formatCurrency(s.taxTotal)}</td>
                  <td className="font-medium">{formatCurrency(s.total)}</td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="text-center py-8 text-surface-400">No hay ventas en este período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  /** Export handlers */
  function handleExport(format: 'pdf' | 'excel' | 'csv') {
    const sales: import('@/lib/exportUtils').SalesRow[] = (report?.recentSales || []).map((s: any) => ({
      saleNumber: s.saleNumber || '',
      date: formatDate(s.createdAt),
      customer: s.customer?.name || 'CF',
      subtotal: s.subtotal || 0,
      taxTotal: s.taxTotal || 0,
      total: s.total || 0,
    }));

    if (sales.length === 0) return;

    const filename = buildExportFilename('reporte-ventas');
    const summary = {
      totalSales: report?.totalSales || 0,
      totalTransactions: report?.totalTransactions || 0,
      averageTicket: report?.averageTicket || 0,
    };

    switch (format) {
      case 'csv':
        exportSalesReportToCsv(sales, filename);
        break;
      case 'excel':
        exportSalesReportToExcel(sales, filename, summary);
        break;
      case 'pdf':
        exportSalesReportToPdf(sales, filename, {
          ...summary,
          dateFrom: fromStr,
          dateTo: toStr,
          companyName: user?.companyName || user?.fullName,
        });
        break;
    }
  }
}
