import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import {
  Package, AlertTriangle, TrendingUp, DollarSign,
  ArrowLeft, FileDown, FileText, FileSpreadsheet, Download, ClipboardList,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { exportInventoryReportToCsv, exportInventoryReportToExcel, exportInventoryReportToPdf, buildExportFilename } from '@/lib/exportUtils';
import type { ApiResponse } from '@/types';

const COLORS = ['#22c55e', '#f87171', '#fbbf24', '#818cf8', '#a78bfa', '#34d399'];

export default function InventoryReportPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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

  const { data } = useQuery({
    queryKey: ['inventory-report', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<any>>('/reports/inventory', {
        params: { companyId: user?.companyId },
      }),
    enabled: !!user?.companyId,
  });

  const r = data?.data?.data || {};

  const pieData = [
    { name: 'Con stock', value: Math.max(0, (r.inStock || 0)) },
    { name: 'Sin stock', value: r.outOfStock || 0 },
    { name: 'Stock bajo', value: r.lowStockCount || 0 },
  ].filter(d => d.value > 0);

  const stats = [
    { label: 'Total productos', value: formatNumber(r.totalProducts || 0), icon: Package, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Con stock', value: formatNumber(r.inStock || 0), icon: TrendingUp, color: 'text-accent-500', bg: 'bg-accent-50' },
    { label: 'Stock bajo', value: formatNumber(r.lowStockCount || 0), icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { label: 'Sin stock', value: formatNumber(r.outOfStock || 0), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Valor inventario', value: formatCurrency(r.inventoryValue || 0), icon: DollarSign, color: 'text-accent-500', bg: 'bg-accent-50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/reportes')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Reporte de inventario</h1>
            <p className="text-surface-500 text-sm">Corte: {r.asOf ? formatDate(r.asOf, 'long') : '—'}</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="card p-4">
            <div className={`p-2 w-fit rounded-lg ${s.bg} mb-3`}><s.icon size={18} className={s.color} /></div>
            <p className="text-xl font-bold text-surface-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-surface-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pie chart */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Distribución de stock</h3>
        <div className="h-64">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [formatNumber(value), 'Productos']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-surface-400">Sin datos de inventario</div>
          )}
        </div>
      </div>

      {/* Summary table */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Resumen</h3>
        <div className="space-y-3">
          {[
            { label: 'Total de productos activos', value: formatNumber(r.totalProducts || 0) },
            { label: 'Productos con stock disponible', value: formatNumber(r.inStock || 0) },
            { label: 'Productos sin stock', value: formatNumber(r.outOfStock || 0) },
            { label: 'Productos con stock bajo (crítico)', value: formatNumber(r.lowStockCount || 0) },
            { label: 'Valor total del inventario (costo)', value: formatCurrency(r.inventoryValue || 0) },
          ].map((row, i) => (
            <div key={i} className="flex justify-between py-2 border-b border-surface-100 dark:border-surface-800 last:border-0">
              <span className="text-surface-600 dark:text-surface-400">{row.label}</span>
              <span className="font-medium text-surface-900 dark:text-white">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /** Export handlers */
  function handleExport(format: 'pdf' | 'excel' | 'csv') {
    const data = {
      totalProducts: r.totalProducts || 0,
      inStock: r.inStock || 0,
      outOfStock: r.outOfStock || 0,
      lowStockCount: r.lowStockCount || 0,
      inventoryValue: r.inventoryValue || 0,
      asOf: r.asOf ? formatDate(r.asOf, 'long') : new Date().toLocaleDateString('es-CO'),
    };

    if (data.totalProducts === 0) return;

    const filename = buildExportFilename('reporte-inventario');

    switch (format) {
      case 'csv':
        exportInventoryReportToCsv(data, filename);
        break;
      case 'excel':
        exportInventoryReportToExcel(data, filename);
        break;
      case 'pdf':
        exportInventoryReportToPdf(data, filename, user?.companyName || user?.fullName);
        break;
    }
  }
}
