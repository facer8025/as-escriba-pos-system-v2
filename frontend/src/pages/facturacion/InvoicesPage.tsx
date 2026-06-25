import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import {
  FileText, Search, Download, X, ChevronLeft, ChevronRight,
  CheckCircle, AlertCircle, Clock, XCircle, Ban, Printer,
} from 'lucide-react';
import type { ApiResponse, PageResponse } from '@/types';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  documentNumber: string;
  documentType: string;
  cufe?: string;
  qrUrl?: string;
  dianStatus: string;
  dianMessage?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  sendAttempts: number;
  createdAt: string;
  sale?: { total: number; customer?: { name: string } };
  customerName?: string;
  total: number;
  customerDoc?: string;
}

interface SaleItem {
  id: string;
  product: { id: string; name: string; internalCode?: string };
  quantity: number;
  unitPrice: number;
  discountType?: string;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

interface SaleDetail {
  id: string;
  saleNumber: string;
  documentType: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  createdAt: string;
  customer?: { name: string; documentNumber?: string } | null;
  items: SaleItem[];
  payments: Array<{ id: string; paymentMethod?: { name: string }; amount: number; reference?: string }>;
}

interface SaleResp {
  id: string;
  saleNumber: string;
  documentType: string;
  total: number;
  status: string;
  createdAt: string;
  customer?: { name: string } | null;
}

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: any }> = {
  VALID: { label: 'Valida', class: 'badge-success', icon: CheckCircle },
  PENDING: { label: 'Pendiente', class: 'badge-warning', icon: Clock },
  PENDING_DIAN: { label: 'Pendiente DIAN', class: 'badge-warning', icon: Clock },
  REJECTED: { label: 'Rechazada', class: 'badge-danger', icon: AlertCircle },
  CANCELLED: { label: 'Anulada', class: 'badge-danger', icon: Ban },
  COMPLETED: { label: 'Completada', class: 'badge-success', icon: CheckCircle },
};

// ----- Ticket formatting functions -----

function padRight(s: string, len: number): string {
  return (s + ' ').padEnd(len, ' ');
}

function padLeft(s: string, len: number): string {
  return (' ' + s).padStart(len, ' ');
}

function formatTicketText(detail: SaleDetail): string {
  const lines: string[] = [];
  const customer = detail.customer;
  const items = detail.items || [];
  const payments = detail.payments || [];

  // Tax groups
  const taxGroups = new Map<string, { rate: number; base: number; amount: number }>();
  for (const item of items) {
    const key = `${item.taxRate}`;
    const existing = taxGroups.get(key) || { rate: item.taxRate, base: 0, amount: 0 };
    existing.base += item.subtotal - item.discountAmount;
    existing.amount += item.taxAmount;
    taxGroups.set(key, existing);
  }

  const sep = '='.repeat(44);
  const dash = '-'.repeat(44);
  const dot = '.'.repeat(44);

  lines.push('');
  lines.push('          ESCRIBA POS');
  lines.push(sep);
  lines.push(`  ${detail.saleNumber}`);
  lines.push(`  ${formatDate(detail.createdAt, 'long')}`);
  lines.push(sep);
  lines.push(`  Cliente: ${customer?.name || 'Consumidor Final (CF)'}`);
  if (customer?.documentNumber) {
    lines.push(`  ID: ${customer.documentNumber}`);
  }
  lines.push(sep);

  // Table header
  lines.push('  Producto                      Cant    P.Unit   Subtotal');
  lines.push('  ' + dot);

  // Items
  for (const item of items) {
    const name = (item.product?.name || 'Producto').substring(0, 28);
    const qty = String(item.quantity).padStart(4);
    const unitPrice = formatCurrency(item.unitPrice).padStart(8);
    const subTotal = formatCurrency(item.subtotal).padStart(9);
    lines.push(`  ${padRight(name, 28)} ${qty} ${unitPrice} ${subTotal}`);

    if (item.taxRate > 0) {
      lines.push(`    IVA ${item.taxRate}%: ${formatCurrency(item.taxAmount).padStart(8)}          Total: ${formatCurrency(item.total).padStart(9)}`);
    } else {
      lines.push(`    IVA Exento/Excluido: $0          Total: ${formatCurrency(item.total).padStart(9)}`);
    }
  }

  lines.push('  ' + dot);

  // Tax breakdown
  if (taxGroups.size > 0) {
    lines.push('  Desglose de IVA:');
    let longestLabel = 0;
    const taxLines: string[] = [];
    for (const [, tg] of taxGroups) {
      const label = tg.rate > 0 ? `IVA ${tg.rate}%` : 'Exento/Excluido';
      longestLabel = Math.max(longestLabel, label.length);
      taxLines.push({ label, base: tg.base, amount: tg.amount } as any);
    }
    for (const tl of taxLines as any[]) {
      lines.push(`  ${padRight(tl.label, 16)} Base: ${padLeft(formatCurrency(tl.base), 9)}  IVA: ${padLeft(formatCurrency(tl.amount), 9)}`);
    }
    lines.push(dash);
  }

  // Totals
  lines.push(`  Subtotal${padLeft(formatCurrency(detail.subtotal), 33)}`);
  if (detail.discountTotal > 0) {
    lines.push(`  Descuento${padLeft('-' + formatCurrency(detail.discountTotal), 32)}`);
  }
  lines.push(`  IVA Total${padLeft(formatCurrency(detail.taxTotal), 33)}`);
  lines.push('  ' + sep);
  lines.push(`  TOTAL${padLeft(formatCurrency(detail.total), 37)}`);

  // Payments
  if (payments.length > 0) {
    lines.push(dash);
    lines.push('  Medios de pago:');
    for (const p of payments) {
      lines.push(`  ${padRight(p.paymentMethod?.name || 'Pago', 20)} ${padLeft(formatCurrency(p.amount), 20)}`);
    }
  }

  // Footer
  lines.push(sep);
  lines.push('       Gracias por su compra!');
  lines.push(sep);
  lines.push('');

  return lines.join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTicketHtml(detail: SaleDetail): string {
  const customer = detail.customer;
  const items = detail.items || [];
  const payments = detail.payments || [];

  const taxGroups = new Map<string, { rate: number; base: number; amount: number }>();
  for (const item of items) {
    const key = `${item.taxRate}`;
    const existing = taxGroups.get(key) || { rate: item.taxRate, base: 0, amount: 0 };
    existing.base += item.subtotal - item.discountAmount;
    existing.amount += item.taxAmount;
    taxGroups.set(key, existing);
  }

  const rows: string[] = [];

  // Header
  rows.push('<div style="text-align:center;margin-bottom:8px">');
  rows.push('<h2 style="margin:0;font-size:16px">ESCRIBA POS</h2>');
  rows.push(`<p style="margin:2px 0;font-size:12px">${escapeHtml(detail.saleNumber)}</p>`);
  rows.push(`<p style="margin:2px 0;font-size:10px;color:#666">${formatDate(detail.createdAt, 'long')}</p>`);
  rows.push('</div>');
  rows.push('<hr style="border-top:1px dashed #999">');

  // Customer
  rows.push('<div style="margin:6px 0">');
  rows.push(`<p style="margin:1px 0;font-size:11px"><strong>Cliente:</strong> ${escapeHtml(customer?.name || 'Consumidor Final (CF)')}</p>`);
  if (customer?.documentNumber) {
    rows.push(`<p style="margin:1px 0;font-size:10px;color:#666">ID: ${escapeHtml(customer.documentNumber)}</p>`);
  }
  rows.push('</div>');
  rows.push('<hr style="border-top:1px dashed #999">');

  // Items header
  rows.push('<div style="display:flex;font-size:10px;font-weight:bold;margin:4px 0">');
  rows.push('<span style="flex:3;text-align:left">Producto</span>');
  rows.push('<span style="flex:1;text-align:center">Cant</span>');
  rows.push('<span style="flex:2;text-align:right">P.Unit</span>');
  rows.push('<span style="flex:2;text-align:right">Subtotal</span>');
  rows.push('</div>');
  rows.push('<hr style="border-top:1px solid #ccc;margin:2px 0">');

  // Items with taxes per item
  for (const item of items) {
    const name = item.product?.name || 'Producto';
    const qty = item.quantity;
    const unitPrice = item.unitPrice;
    const itemSubtotal = item.subtotal || (unitPrice * qty);

    rows.push('<div style="margin:3px 0">');
    rows.push('<div style="display:flex;font-size:10px">');
    rows.push(`<span style="flex:3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(name)}</span>`);
    rows.push(`<span style="flex:1;text-align:center">${qty}</span>`);
    rows.push(`<span style="flex:2;text-align:right">${formatCurrency(unitPrice)}</span>`);
    rows.push(`<span style="flex:2;text-align:right">${formatCurrency(itemSubtotal)}</span>`);
    rows.push('</div>');
    if (item.taxRate > 0) {
      rows.push(`<div style="display:flex;font-size:9px;color:#666">`);
      rows.push(`<span style="flex:3"> IVA ${item.taxRate}%: ${formatCurrency(item.taxAmount)}</span>`);
      rows.push(`<span style="flex:3;text-align:right">Total: ${formatCurrency(item.total)}</span>`);
      rows.push('</div>');
    } else {
      rows.push(`<div style="display:flex;font-size:9px;color:#666">`);
      rows.push(`<span style="flex:3"> IVA Exento/Excluido: $0</span>`);
      rows.push(`<span style="flex:3;text-align:right">Total: ${formatCurrency(item.total)}</span>`);
      rows.push('</div>');
    }
    rows.push('</div>');
  }

  rows.push('<hr style="border-top:1px dashed #999">');

  // Tax breakdown grouped
  if (taxGroups.size > 0) {
    rows.push('<div style="margin:4px 0">');
    rows.push('<p style="margin:2px 0;font-size:10px;font-weight:bold">Desglose de IVA:</p>');
    for (const [, tg] of taxGroups) {
      const label = tg.rate > 0 ? `IVA ${tg.rate}%` : 'Exento/Excluido';
      rows.push(`<div style="display:flex;font-size:10px">`);
      rows.push(`<span style="flex:1">${label}</span>`);
      rows.push(`<span style="text-align:right;min-width:70px">Base: ${formatCurrency(tg.base)}</span>`);
      rows.push(`<span style="text-align:right;min-width:70px">IVA: ${formatCurrency(tg.amount)}</span>`);
      rows.push('</div>');
    }
    rows.push('</div>');
    rows.push('<hr style="border-top:1px dashed #999">');
  }

  // Totals
  rows.push('<div style="margin:6px 0">');
  rows.push(`<div style="display:flex;font-size:11px"><span style="flex:1">Subtotal</span><span>${formatCurrency(detail.subtotal)}</span></div>`);
  if (detail.discountTotal > 0) {
    rows.push(`<div style="display:flex;font-size:11px;color:red"><span style="flex:1">Descuento</span><span>-${formatCurrency(detail.discountTotal)}</span></div>`);
  }
  rows.push(`<div style="display:flex;font-size:11px"><span style="flex:1">IVA Total</span><span>${formatCurrency(detail.taxTotal)}</span></div>`);
  rows.push('<hr style="border-top:1px solid #000;margin:2px 0">');
  rows.push(`<div style="display:flex;font-size:14px;font-weight:bold"><span style="flex:1">TOTAL</span><span>${formatCurrency(detail.total)}</span></div>`);
  rows.push('</div>');

  // Payment methods
  if (payments.length > 0) {
    rows.push('<hr style="border-top:1px dashed #999">');
    rows.push('<div style="margin:4px 0">');
    rows.push('<p style="margin:2px 0;font-size:10px;font-weight:bold">Medios de pago:</p>');
    for (const p of payments) {
      rows.push(`<div style="display:flex;font-size:10px"><span style="flex:1">${p.paymentMethod?.name || 'Pago'}</span><span>${formatCurrency(p.amount)}</span></div>`);
    }
    rows.push('</div>');
  }

  rows.push('<hr style="border-top:1px dashed #999">');
  rows.push('<div style="text-align:center;margin-top:8px;font-size:10px">');
  rows.push('<p style="margin:2px 0">Gracias por su compra!</p>');
  rows.push('</div>');

  return rows.join('\n');
}

async function fetchAndPrint(doc: Invoice) {
  try {
    const resp = await api.get<ApiResponse<SaleDetail>>(`/sales/${doc.id}`);
    const detail = resp.data?.data;
    if (!detail) { printSimpleTicket(doc); return; }

    const win = window.open('', '_blank');
    if (!win) { toast.error('Habilita ventanas emergentes para imprimir'); return; }
    win.document.write(`
      <html><head>
        <title>${doc.documentNumber}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 8px; }
          @media print { body { margin: 0; } }
          @page { margin: 0; size: 80mm auto; }
          hr { border: none; border-top: 1px dashed #999; margin: 4px 0; }
        </style>
      </head><body>
        ${formatTicketHtml(detail)}
        <script>window.print();window.close();<\/script>
      </body></html>
    `);
    win.document.close();
  } catch {
    printSimpleTicket(doc);
  }
}

function printSimpleTicket(doc: Invoice) {
  const win = window.open('', '_blank');
  if (!win) { toast.error('Habilita ventanas emergentes para imprimir'); return; }
  win.document.write(`
    <html><head>
      <title>${doc.documentNumber}</title>
      <style>body{font-family:'Courier New',monospace;font-size:12px;width:80mm;margin:0 auto;padding:8px}hr{border:none;border-top:1px dashed #999;margin:4px 0}@media print{body{margin:0}}@page{margin:0;size:80mm auto}</style>
    </head><body>
      <div style="text-align:center;margin-bottom:8px">
        <h2 style="margin:0;font-size:16px">ESCRIBA POS</h2>
        <p style="margin:2px 0;font-size:12px">${escapeHtml(doc.documentNumber)}</p>
        <p style="margin:2px 0;font-size:10px;color:#666">${formatDate(doc.createdAt, 'long')}</p>
      </div>
      <hr>
      <p style="font-size:11px"><strong>Cliente:</strong> ${escapeHtml(doc.customerName || 'Consumidor Final (CF)')}</p>
      <hr>
      <p style="font-size:14px;font-weight:bold;text-align:center">Total: ${formatCurrency(doc.total || 0)}</p>
      <hr>
      <p style="text-align:center;font-size:10px">Gracias por su compra!</p>
      <script>window.print();window.close();<\/script>
    </body></html>
  `);
  win.document.close();
}

async function downloadTicket(doc: Invoice) {
  try {
    const resp = await api.get<ApiResponse<SaleDetail>>(`/sales/${doc.id}`);
    const detail = resp.data?.data;
    const content = detail ? formatTicketText(detail) : simpleText(doc);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.documentNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Documento descargado');
  } catch {
    simpleDownload(doc);
  }
}

function simpleDownload(doc: Invoice) {
  const blob = new Blob([simpleText(doc)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.documentNumber}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Documento descargado');
}

function simpleText(doc: Invoice): string {
  return [
    '',
    '          ESCRIBA POS',
    '====================================',
    `  ${doc.documentNumber}`,
    `  ${formatDate(doc.createdAt, 'long')}`,
    `  Cliente: ${doc.customerName || 'Consumidor Final (CF)'}`,
    '',
    '------------------------------------',
    `  Total: ${formatCurrency(doc.total || 0)}`,
    '',
    '====================================',
    '       Gracias por su compra!',
    '====================================',
    '',
  ].join('\n');
}

// ----- Component -----

export default function InvoicesPage() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<SaleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['invoices', user?.companyId, page, statusFilter],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<Invoice>>>('/invoices', {
        params: { companyId: user?.companyId, page, size: 25, status: statusFilter || undefined },
      }),
    enabled: !!user?.companyId,
    refetchInterval: 30000,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-invoices', user?.companyId, page],
    queryFn: () =>
      api.get<ApiResponse<PageResponse<SaleResp>>>('/sales', {
        params: { companyId: user?.companyId, page, size: 25 },
      }),
    enabled: !!user?.companyId,
    refetchInterval: 30000,
  });

  const electronicDocs = invData?.data?.data?.content || [];
  const sales = salesData?.data?.data?.content || [];

  // Convert ALL sales to invoice-like items (both TICKET and INVOICE)
  const salesAsInvoices: Invoice[] = sales.map(s => ({
    id: s.id,
    documentNumber: s.saleNumber,
    documentType: s.documentType === 'INVOICE' ? 'INVOICE' : 'TICKET',
    dianStatus: s.documentType === 'INVOICE' ? 'PENDING_DIAN' : (s.status === 'COMPLETED' ? 'COMPLETED' : s.status),
    sendAttempts: 0,
    createdAt: s.createdAt,
    total: s.total,
    customerName: s.customer?.name,
  }));

  const invoices: Invoice[] = [...electronicDocs, ...salesAsInvoices];

  // Deduplicate by documentNumber
  const seen = new Set<string>();
  const uniqueInvoices = invoices.filter(inv => {
    const key = inv.documentNumber;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const totalElements = uniqueInvoices.length;
  const filteredInvoices = uniqueInvoices
    .filter(inv => !statusFilter || inv.dianStatus === statusFilter)
    .filter(inv => !searchTerm || inv.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (inv.customerName && inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())));

  const getStatusConfig = (inv: Invoice) => {
    if (inv.dianStatus in STATUS_CONFIG) return STATUS_CONFIG[inv.dianStatus];
    return STATUS_CONFIG.PENDING;
  };

  const handleDownload = (inv: Invoice) => {
    if (inv.pdfUrl) { window.open(inv.pdfUrl, '_blank'); }
    else if (inv.xmlUrl) { window.open(inv.xmlUrl, '_blank'); }
    else { downloadTicket(inv); }
  };

  const handleRowClick = async (inv: Invoice) => {
    setSelected(inv);
    setSelectedDetail(null);
    setLoadingDetail(true);
    try {
      const resp = await api.get<ApiResponse<SaleDetail>>(`/sales/${inv.id}`);
      if (resp.data?.data) {
        setSelectedDetail(resp.data.data);
      }
    } catch {
      // No hay detalle disponible (ej: documento electronico real)
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Facturas / Documentos</h1>
          <p className="text-surface-500 mt-1">
            {totalElements} documentos ({electronicDocs.length} electronicos · {salesAsInvoices.filter(s => s.documentType === 'TICKET').length} tickets)
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar por N° documento o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }} className="input w-auto">
            <option value="">Todos los estados</option>
            <option value="VALID">Valida (DIAN)</option>
            <option value="COMPLETED">Completada (Ticket POS)</option>
            <option value="PENDING_DIAN">Pendiente DIAN</option>
            <option value="PENDING">Pendiente</option>
            <option value="REJECTED">Rechazada</option>
            <option value="CANCELLED">Anulada</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>N° Documento</th>
              <th>Tipo</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th className="w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invLoading || salesLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-surface-400">Cargando...</td></tr>
            ) : filteredInvoices.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-surface-400">
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                <p>No hay documentos registrados</p>
              </td></tr>
            ) : (
              filteredInvoices.map(inv => {
                const sc = getStatusConfig(inv);
                const Icon = sc.icon;
                return (
                  <tr key={inv.id} className="hover:bg-surface-50/50 cursor-pointer" onClick={() => handleRowClick(inv)}>
                    <td className="font-mono text-sm font-medium text-surface-900 dark:text-white">{inv.documentNumber}</td>
                    <td>
                      <span className={cn('badge text-[10px]',
                        inv.documentType === 'INVOICE' ? 'badge-info' :
                        inv.documentType === 'TICKET' ? 'badge-neutral' : 'badge-neutral')}>
                        {inv.documentType === 'INVOICE' ? 'Factura Electronica' : 'Ticket POS'}
                      </span>
                    </td>
                    <td className="text-sm text-surface-700 dark:text-surface-300">{formatDate(inv.createdAt)}</td>
                    <td className="text-surface-700 dark:text-surface-300">{inv.customerName || inv.sale?.customer?.name || '—'}</td>
                    <td className="font-medium text-surface-900 dark:text-white">
                      {inv.total ? formatCurrency(inv.total) : (inv.sale ? formatCurrency(inv.sale.total) : '—')}
                    </td>
                    <td>
                      <span className={`badge ${sc.class} flex items-center gap-1 w-fit`}>
                        <Icon size={12} />{sc.label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDownload(inv)} className="btn-ghost p-1.5" title={inv.pdfUrl ? 'Descargar PDF' : 'Descargar ticket'}>
                          <Download size={14} />
                        </button>
                        <button onClick={() => fetchAndPrint(inv)} className="btn-ghost p-1.5" title="Imprimir">
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content w-[600px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Documento {selected.documentNumber}</h2>
              <button onClick={() => setSelected(null)} className="btn-ghost p-1"><X size={18} /></button>
            </div>

            {loadingDetail ? (
              <div className="text-center py-8 text-surface-400">Cargando detalle...</div>
            ) : (
              <>
                {/* Header info */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl text-sm">
                  <div>
                    <p className="text-xs text-surface-400">Tipo</p>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {selected.documentType === 'INVOICE' ? 'Factura Electronica' : 'Ticket POS'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Fecha</p>
                    <p className="font-medium text-surface-900 dark:text-white">{formatDate(selected.createdAt, 'long')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Cliente</p>
                    <p className="font-medium text-surface-900 dark:text-white">
                      {selectedDetail?.customer?.name || selected.customerName || 'Consumidor Final (CF)'}
                    </p>
                    {selectedDetail?.customer?.documentNumber && (
                      <p className="text-xs text-surface-400">ID: {selectedDetail.customer.documentNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-surface-400">Estado</p>
                    <span className={cn('badge', getStatusConfig(selected).class)}>{getStatusConfig(selected).label}</span>
                  </div>
                </div>

                {/* Items table */}
                {selectedDetail && selectedDetail.items && selectedDetail.items.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-surface-900 dark:text-white mb-2">Productos</h3>
                    <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-surface-700">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-surface-50 dark:bg-surface-800/50">
                            <th className="px-3 py-2 text-left font-semibold text-surface-500">Producto</th>
                            <th className="px-3 py-2 text-center font-semibold text-surface-500">Cant</th>
                            <th className="px-3 py-2 text-right font-semibold text-surface-500">P.Unit</th>
                            <th className="px-3 py-2 text-right font-semibold text-surface-500">IVA</th>
                            <th className="px-3 py-2 text-right font-semibold text-surface-500">Subtotal</th>
                            <th className="px-3 py-2 text-right font-semibold text-surface-500">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDetail.items.map((item) => (
                            <tr key={item.id} className="border-t border-surface-100 dark:border-surface-800">
                              <td className="px-3 py-2 text-surface-900 dark:text-white font-medium">{item.product?.name || 'Producto'}</td>
                              <td className="px-3 py-2 text-center text-surface-700 dark:text-surface-300">{item.quantity}</td>
                              <td className="px-3 py-2 text-right text-surface-700 dark:text-surface-300">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-3 py-2 text-right">
                                <span className={item.taxRate > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-surface-400'}>
                                  {item.taxRate > 0 ? `${item.taxRate}%` : 'Exento'}
                                </span>
                                <span className="text-surface-400 ml-1">({formatCurrency(item.taxAmount)})</span>
                              </td>
                              <td className="px-3 py-2 text-right text-surface-700 dark:text-surface-300">{formatCurrency(item.subtotal)}</td>
                              <td className="px-3 py-2 text-right font-medium text-surface-900 dark:text-white">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Totals */}
                {selectedDetail && (
                  <div className="p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Subtotal</span>
                      <span className="text-surface-900 dark:text-white">{formatCurrency(selectedDetail.subtotal)}</span>
                    </div>
                    {selectedDetail.discountTotal > 0 && (
                      <div className="flex justify-between text-red-500">
                        <span>Descuento</span>
                        <span>-{formatCurrency(selectedDetail.discountTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-surface-500">IVA Total</span>
                      <span className="text-surface-900 dark:text-white">{formatCurrency(selectedDetail.taxTotal)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-surface-200 dark:border-surface-700">
                      <span className="text-surface-900 dark:text-white">TOTAL</span>
                      <span className="text-primary-600 dark:text-primary-400">{formatCurrency(selectedDetail.total)}</span>
                    </div>
                  </div>
                )}

                {/* Simple view when no detail */}
                {!selectedDetail && !loadingDetail && (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-surface-400">Valor</span>
                      <span className="font-medium text-surface-900 dark:text-white">
                        {selected.total ? formatCurrency(selected.total) : (selected.sale ? formatCurrency(selected.sale.total) : '—')}
                      </span>
                    </div>
                    {selected.cufe && (
                      <div>
                        <span className="text-surface-400">CUFE:</span>
                        <p className="font-mono text-xs mt-1 break-all bg-surface-50 dark:bg-surface-800 p-2 rounded text-surface-700 dark:text-surface-300">{selected.cufe}</p>
                      </div>
                    )}
                    {selected.dianMessage && (
                      <div>
                        <span className="text-surface-400">Mensaje DIAN:</span>
                        <p className="text-xs mt-1 text-red-500">{selected.dianMessage}</p>
                      </div>
                    )}
                  </div>
                )}

                {selected.documentType === 'INVOICE' && selected.dianStatus === 'PENDING_DIAN' && (
                  <div className="p-3 mt-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-700 dark:text-yellow-400">
                    Esta factura electronica esta pendiente de envio a la DIAN.
                    La integracion con el proveedor tecnologico estara disponible proximamente.
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setSelected(null); handleDownload(selected); }} className="btn-primary flex-1">
                <Download size={16} /> {selected.pdfUrl ? 'Descargar PDF' : 'Descargar ticket'}
              </button>
              <button onClick={() => { setSelected(null); fetchAndPrint(selected); }} className="btn-secondary flex-1">
                <Printer size={16} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {totalElements > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-400">Mostrando {Math.min(25, totalElements)} de {totalElements}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0,p-1))} disabled={page===0} className="btn-ghost p-2"><ChevronLeft size={16} /></button>
            <button onClick={() => setPage(p => p+1)} disabled={(page+1)*25>=totalElements} className="btn-ghost p-2"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
