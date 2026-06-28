import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency } from './utils';
import type { Product } from '@/types';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

type StockLabel = 'Sin stock' | 'Stock bajo' | 'En stock' | 'Stock excedido';
type ExportRow = Record<string, string | number>;

export interface ColDef {
  header: string;
  dataKey: string;
}

export interface PdfOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  summaryLines?: string[];
  colDefs: ColDef[];
  columnStyles?: Record<string, Partial<{ cellWidth: number; halign: 'left' | 'center' | 'right' | 'justify' }>>;
  footerText?: string;
  orientation?: 'portrait' | 'landscape';
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function getStockLabel(current: number, min: number): StockLabel {
  if (current <= 0) return 'Sin stock';
  if (current <= min) return 'Stock bajo';
  return 'En stock';
}

// ── Inventory rows ──

export function prepareInventoryRows(products: Product[]): ExportRow[] {
  return products.map((p) => ({
    Producto: p.name,
    'Código Interno': p.internalCode || '-',
    'Código Barras': p.barcode || '-',
    Categoría: p.categoryName || '-',
    'Stock Mínimo': p.stockMin,
    'Stock Actual': p.currentStock,
    'Stock Máximo': p.stockMax > 0 ? p.stockMax : 0,
    'Costo Promedio': p.avgCost,
    'Valor Total': p.currentStock * p.avgCost,
    'Estado Stock': getStockLabel(p.currentStock, p.stockMin),
  }));
}

// ── Catalog rows ──

export function prepareCatalogRows(products: Product[]): ExportRow[] {
  return products.map((p) => ({
    Producto: p.name,
    'Código Interno': p.internalCode || '-',
    'Código Barras': p.barcode || '-',
    Categoría: p.categoryName || '-',
    'Precio Compra': p.purchasePrice,
    'Precio Venta': p.salePrice,
    'Precio Mayorista': p.wholesalePrice ?? 0,
    'Stock Actual': p.currentStock,
    'Stock Mínimo': p.stockMin,
    'Stock Máximo': p.stockMax > 0 ? p.stockMax : 0,
    'Costo Promedio': p.avgCost,
    'Tipo IVA': p.vatType === 'STANDARD' ? `${p.vatRate}%` :
                 p.vatType === 'REDUCED' ? `${p.vatRate}%` :
                 p.vatType === 'EXCLUDED' ? 'Excluido' :
                 p.vatType === 'EXEMPT' ? 'Exento' : p.vatType || `${p.vatRate}%`,
    Estado: p.status === 'ACTIVE' ? 'Activo' :
            p.status === 'INACTIVE' ? 'Inactivo' : 'Discontinuado',
  }));
}

// ──────────────────────────────────────────────
// Generic CSV Export
// ──────────────────────────────────────────────

export function exportGenericCsv(
  rows: ExportRow[],
  filename: string,
  currencyFields?: string[],
): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvRows = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (currencyFields?.includes(h)) {
          return (val as number).toFixed(2);
        }
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      })
      .join(','),
  );

  const bom = '\uFEFF';
  const csv = bom + headers.join(',') + '\n' + csvRows.join('\n') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

// ──────────────────────────────────────────────
// Generic Excel Export
// ──────────────────────────────────────────────

export function exportGenericExcel(
  rows: ExportRow[],
  filename: string,
  sheetName: string = 'Datos',
  colWidths?: XLSX.ColInfo[],
): void {
  if (rows.length === 0) return;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  if (colWidths) {
    ws['!cols'] = colWidths;
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ──────────────────────────────────────────────
// Generic PDF Export
// ──────────────────────────────────────────────

export function exportGenericPdf(
  rows: ExportRow[],
  filename: string,
  options: PdfOptions,
): void {
  if (rows.length === 0) return;

  const orientation = options.orientation ?? 'landscape';
  const doc = new jsPDF(orientation, 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Header ──
  let cursorY = 18;
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text(options.title, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 7;

  if (options.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(options.subtitle, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;
  }

  if (options.companyName) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(options.companyName, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;
  }

  // ── Date line ──
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const dateStr = new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  doc.text(`Generado: ${dateStr}`, pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 5;

  // ── Summary lines ──
  if (options.summaryLines && options.summaryLines.length > 0) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    options.summaryLines.forEach((line) => {
      doc.text(line, 14, cursorY);
      cursorY += 4.5;
    });
    cursorY += 2;
  }

  // ── Table ──
  const colDefs = options.colDefs;
  const tableBody = rows.map((r) => {
    const row: Record<string, string> = {};
    for (const col of colDefs) {
      const raw = r[col.dataKey];
      row[col.dataKey] = String(raw);
    }
    return row;
  });

  const totalPages = { count: 0 };

  autoTable(doc, {
    head: [colDefs.map((c) => c.header)],
    body: tableBody.map((r) => colDefs.map((c) => r[c.dataKey])),
    startY: cursorY,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: options.columnStyles as any,
    margin: { left: 10, right: 10 },
    didDrawPage: () => {
      totalPages.count = doc.getNumberOfPages();
    },
  });

  // ── Footer (all pages) ──
  const footer = options.footerText ?? 'ESCRIBA POS';
  for (let i = 1; i <= totalPages.count; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `${footer} — Página ${i} de ${totalPages.count}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  doc.save(`${filename}.pdf`);
}

// ──────────────────────────────────────────────
// Inventory-specific exports
// ──────────────────────────────────────────────

export function exportToCsv(products: Product[], filename: string): void {
  const rows = prepareInventoryRows(products);
  exportGenericCsv(rows, filename, ['Costo Promedio', 'Valor Total']);
}

export function exportToExcel(products: Product[], filename: string): void {
  const rows = prepareInventoryRows(products);
  exportGenericExcel(rows, filename, 'Inventario', [
    { wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 20 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
  ]);
}

export function exportToPdf(
  products: Product[],
  filename: string,
  companyName?: string,
): void {
  const rows = prepareInventoryRows(products);

  const outOfStock = products.filter((p) => p.currentStock <= 0).length;
  const criticalStock = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.stockMin).length;
  const totalValue = products.reduce((sum, p) => sum + p.currentStock * p.avgCost, 0);

  exportGenericPdf(rows, filename, {
    title: 'Resumen de Inventario',
    companyName,
    summaryLines: [
      `Total productos: ${products.length}  |  Stock crítico: ${criticalStock}  |  Sin stock: ${outOfStock}  |  Valor inventario: ${formatCurrency(totalValue)}`,
    ],
    colDefs: [
      { header: 'Producto', dataKey: 'Producto' },
      { header: 'Código', dataKey: 'Código Interno' },
      { header: 'Categoría', dataKey: 'Categoría' },
      { header: 'Stock Mín', dataKey: 'Stock Mínimo' },
      { header: 'Stock Actual', dataKey: 'Stock Actual' },
      { header: 'Stock Máx', dataKey: 'Stock Máximo' },
      { header: 'Costo Prom.', dataKey: 'Costo Promedio' },
      { header: 'Valor Total', dataKey: 'Valor Total' },
      { header: 'Estado', dataKey: 'Estado Stock' },
    ],
    columnStyles: {
      '0': { cellWidth: 55 },
      '3': { halign: 'center' },
      '4': { halign: 'center' },
      '5': { halign: 'center' },
      '6': { halign: 'right' },
      '7': { halign: 'right' },
      '8': { halign: 'center' },
    } as Record<string, Partial<{ cellWidth: number; halign: 'left' | 'center' | 'right' | 'justify' }>>,
    footerText: 'ESCRIBA POS — Resumen de Inventario',
  });
}

// ──────────────────────────────────────────────
// Catalog-specific exports
// ──────────────────────────────────────────────

export function exportCatalogToCsv(products: Product[], filename: string): void {
  const rows = prepareCatalogRows(products);
  const currencyFields = ['Precio Compra', 'Precio Venta', 'Precio Mayorista', 'Costo Promedio'];
  exportGenericCsv(rows, filename, currencyFields);
}

export function exportCatalogToExcel(products: Product[], filename: string): void {
  const rows = prepareCatalogRows(products);
  exportGenericExcel(rows, filename, 'Catálogo de Productos', [
    { wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 20 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 12 },
  ]);
}

export function exportCatalogToPdf(
  products: Product[],
  filename: string,
  companyName?: string,
): void {
  const rows = prepareCatalogRows(products);
  const activeCount = products.filter((p) => p.status === 'ACTIVE').length;
  const totalValue = products.reduce((sum, p) => sum + p.currentStock * p.avgCost, 0);
  const totalStock = products.reduce((sum, p) => sum + p.currentStock, 0);

  exportGenericPdf(rows, filename, {
    title: 'Catálogo de Productos',
    companyName,
    orientation: 'landscape',
    summaryLines: [
      `Total productos: ${products.length}  |  Activos: ${activeCount}  |  Stock total: ${totalStock.toFixed(0)} uds  |  Valor inventario: ${formatCurrency(totalValue)}`,
    ],
    colDefs: [
      { header: 'Producto', dataKey: 'Producto' },
      { header: 'Código', dataKey: 'Código Interno' },
      { header: 'Categoría', dataKey: 'Categoría' },
      { header: 'Precio Compra', dataKey: 'Precio Compra' },
      { header: 'Precio Venta', dataKey: 'Precio Venta' },
      { header: 'Stock Actual', dataKey: 'Stock Actual' },
      { header: 'Stock Mín', dataKey: 'Stock Mínimo' },
      { header: 'Costo Prom.', dataKey: 'Costo Promedio' },
      { header: 'Tipo IVA', dataKey: 'Tipo IVA' },
      { header: 'Estado', dataKey: 'Estado' },
    ],
    columnStyles: {
      '0': { cellWidth: 50 },
      '2': { cellWidth: 22 },
      '3': { halign: 'right' },
      '4': { halign: 'right' },
      '5': { halign: 'center' },
      '6': { halign: 'center' },
      '7': { halign: 'right' },
      '8': { halign: 'center' },
      '9': { halign: 'center' },
    } as Record<string, Partial<{ cellWidth: number; halign: 'left' | 'center' | 'right' | 'justify' }>>,
    footerText: 'ESCRIBA POS — Catálogo de Productos',
  });
}

// ──────────────────────────────────────────────
// Sales Report exports
// ──────────────────────────────────────────────

export interface SalesRow {
  saleNumber: string;
  date: string;
  customer: string;
  subtotal: number;
  taxTotal: number;
  total: number;
}

export function exportSalesReportToCsv(
  rows: SalesRow[],
  filename: string,
): void {
  if (rows.length === 0) return;
  const exportRows = rows.map((r) => ({
    Venta: r.saleNumber,
    Fecha: r.date,
    Cliente: r.customer,
    Subtotal: r.subtotal,
    IVA: r.taxTotal,
    Total: r.total,
  }));
  exportGenericCsv(exportRows, filename, ['Subtotal', 'IVA', 'Total']);
}

export function exportSalesReportToExcel(
  rows: SalesRow[],
  filename: string,
  summary?: { totalSales: number; totalTransactions: number; averageTicket: number },
): void {
  if (rows.length === 0 && !summary) return;

  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen
  if (summary) {
    const summaryRows = [
      { Métrica: 'Total ventas', Valor: summary.totalSales },
      { Métrica: 'Transacciones', Valor: summary.totalTransactions },
      { Métrica: 'Ticket promedio', Valor: summary.averageTicket },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryRows);
    ws1['!cols'] = [{ wch: 24 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
  }

  // Sheet 2: Ventas
  if (rows.length > 0) {
    const exportRows = rows.map((r) => ({
      Venta: r.saleNumber,
      Fecha: r.date,
      Cliente: r.customer,
      Subtotal: r.subtotal,
      IVA: r.taxTotal,
      Total: r.total,
    }));
    const ws2 = XLSX.utils.json_to_sheet(exportRows);
    ws2['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 30 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
    ];
    XLSX.utils.book_append_sheet(wb, ws2, 'Ventas');
  }

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportSalesReportToPdf(
  rows: SalesRow[],
  filename: string,
  options: {
    companyName?: string;
    dateFrom: string;
    dateTo: string;
    totalSales: number;
    totalTransactions: number;
    averageTicket: number;
  },
): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  let cursorY = 18;
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text('Reporte de Ventas por Período', pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 7;

  if (options.companyName) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(options.companyName, pageWidth / 2, cursorY, { align: 'center' });
    cursorY += 6;
  }

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Período: ${options.dateFrom} — ${options.dateTo}`,
    pageWidth / 2, cursorY, { align: 'center' },
  );
  cursorY += 6;

  // Summary
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Total ventas: ${formatCurrency(options.totalSales)}  |  Transacciones: ${options.totalTransactions}  |  Ticket promedio: ${formatCurrency(options.averageTicket)}`,
    14, cursorY,
  );
  cursorY += 8;

  // Table
  const colDefs: ColDef[] = [
    { header: 'Venta', dataKey: 'Venta' },
    { header: 'Fecha', dataKey: 'Fecha' },
    { header: 'Cliente', dataKey: 'Cliente' },
    { header: 'Subtotal', dataKey: 'Subtotal' },
    { header: 'IVA', dataKey: 'IVA' },
    { header: 'Total', dataKey: 'Total' },
  ];

  const tableBody: Record<string, string>[] = rows.map((r) => ({
    Venta: r.saleNumber,
    Fecha: r.date,
    Cliente: r.customer,
    Subtotal: formatCurrency(r.subtotal),
    IVA: formatCurrency(r.taxTotal),
    Total: formatCurrency(r.total),
  }));

  const totalPages = { count: 0 };

  autoTable(doc, {
    head: [colDefs.map((c) => c.header)],
    body: tableBody.map((r) => colDefs.map((c) => r[c.dataKey])),
    startY: cursorY,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 7, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      '0': { cellWidth: 38 },
      '3': { halign: 'right' },
      '4': { halign: 'right' },
      '5': { halign: 'right' },
    },
    margin: { left: 10, right: 10 },
    didDrawPage: () => { totalPages.count = doc.getNumberOfPages(); },
  });

  for (let i = 1; i <= totalPages.count; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `ESCRIBA POS — Reporte de Ventas — Página ${i} de ${totalPages.count}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  doc.save(`${filename}.pdf`);
}

// ──────────────────────────────────────────────
// Inventory Report exports
// ──────────────────────────────────────────────

export interface InventoryReportSummary {
  totalProducts: number;
  inStock: number;
  outOfStock: number;
  lowStockCount: number;
  inventoryValue: number;
  asOf: string;
}

export function exportInventoryReportToCsv(
  data: InventoryReportSummary,
  filename: string,
): void {
  const pctStock = data.totalProducts > 0
    ? ((data.inStock / data.totalProducts) * 100).toFixed(1)
    : '0.0';
  const pctLow = data.totalProducts > 0
    ? ((data.lowStockCount / data.totalProducts) * 100).toFixed(1)
    : '0.0';
  const pctOut = data.totalProducts > 0
    ? ((data.outOfStock / data.totalProducts) * 100).toFixed(1)
    : '0.0';

  const rows = [
    { Métrica: 'Fecha de corte', Valor: data.asOf },
    { Métrica: '', Valor: '' },
    { Métrica: 'RESUMEN GENERAL', Valor: '' },
    { Métrica: 'Total de productos activos', Valor: String(data.totalProducts) },
    { Métrica: 'Productos con stock disponible', Valor: `${data.inStock} (${pctStock}%)` },
    { Métrica: 'Productos sin stock', Valor: `${data.outOfStock} (${pctOut}%)` },
    { Métrica: 'Productos con stock bajo (crítico)', Valor: `${data.lowStockCount} (${pctLow}%)` },
    { Métrica: 'Valor total del inventario (costo)', Valor: formatCurrency(data.inventoryValue) },
  ];

  const headers = ['Métrica', 'Valor'];
  const csvRows = rows.map((r) =>
    headers
      .map((h) => {
        const val = r[h as keyof typeof r];
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      })
      .join(','),
  );
  const bom = '\uFEFF';
  const csv = bom + headers.join(',') + '\n' + csvRows.join('\n') + '\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportInventoryReportToExcel(
  data: InventoryReportSummary,
  filename: string,
): void {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen ──
  const pctStock = data.totalProducts > 0
    ? ((data.inStock / data.totalProducts) * 100).toFixed(1)
    : '0.0';
  const pctOut = data.totalProducts > 0
    ? ((data.outOfStock / data.totalProducts) * 100).toFixed(1)
    : '0.0';
  const pctLow = data.totalProducts > 0
    ? ((data.lowStockCount / data.totalProducts) * 100).toFixed(1)
    : '0.0';

  const summaryRows = [
    ['REPORTE DE INVENTARIO'],
    [],
    ['Fecha de corte:', data.asOf],
    [],
    ['RESUMEN GENERAL'],
    ['Total de productos activos', data.totalProducts],
    ['Productos con stock disponible', `${data.inStock} (${pctStock}%)`],
    ['Productos sin stock', `${data.outOfStock} (${pctOut}%)`],
    ['Productos con stock bajo (crítico)', `${data.lowStockCount} (${pctLow}%)`],
    ['Valor total del inventario (costo)', data.inventoryValue],
    [],
    ['DISTRIBUCIÓN DE STOCK'],
    ['Con stock', data.inStock],
    ['Stock bajo', data.lowStockCount],
    ['Sin stock', data.outOfStock],
  ];

  const ws = XLSX.utils.aoa_to_sheet(summaryRows);

  // Column widths
  ws['!cols'] = [{ wch: 42 }, { wch: 24 }];

  // Merge cells for title
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Title row
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }, // RESUMEN GENERAL
    { s: { r: 11, c: 0 }, e: { r: 11, c: 1 } }, // DISTRIBUCIÓN
  ];

  // Bold title rows
  for (const rowIdx of [0, 4, 11]) {
    for (let c = 0; c < 2; c++) {
      const ref = XLSX.utils.encode_cell({ r: rowIdx, c });
      if (!ws[ref]) continue;
      ws[ref].s = {
        font: { bold: true, sz: rowIdx === 0 ? 14 : 11 },
        alignment: { horizontal: rowIdx === 0 ? 'center' : 'left' },
        fill: rowIdx === 0 ? { fgColor: { rgb: '2563EB' } } :
              rowIdx === 4 || rowIdx === 11 ? { fgColor: { rgb: 'E2E8F0' } } : undefined,
      };
      if (rowIdx === 0 && ws[ref]) {
        ws[ref].s.font.color = { rgb: 'FFFFFF' };
      }
    }
  }

  // Bold the metric labels (col A for data rows)
  for (let r = 5; r <= 9; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws[ref]) {
      ws[ref].s = { font: { bold: true } };
    }
  }
  for (let r = 12; r <= 14; r++) {
    const ref = XLSX.utils.encode_cell({ r, c: 0 });
    if (ws[ref]) {
      ws[ref].s = { font: { bold: true } };
    }
  }

  // Format currency cell
  const currencyCell = XLSX.utils.encode_cell({ r: 9, c: 1 });
  if (ws[currencyCell]) {
    ws[currencyCell].z = '$#,##0';
    ws[currencyCell].t = 'n';
    ws[currencyCell].v = data.inventoryValue;
  }

  // Format number cells
  for (const r of [5, 6, 7, 8, 12, 13, 14]) {
    const ref = XLSX.utils.encode_cell({ r, c: 1 });
    if (ws[ref] && typeof ws[ref].v === 'number') {
      ws[ref].z = '#,##0';
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Resumen');

  // ── Sheet 2: Detalle adicional ──
  const detailRows = [
    ['Métrica', 'Valor', '% del total'],
    ['Total productos', data.totalProducts, '100%'],
    ['Con stock', data.inStock, `${pctStock}%`],
    ['Stock bajo', data.lowStockCount, `${pctLow}%`],
    ['Sin stock', data.outOfStock, `${pctOut}%`],
    [],
    ['Valor inventario', formatCurrency(data.inventoryValue), ''],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(detailRows);
  ws2['!cols'] = [{ wch: 24 }, { wch: 24 }, { wch: 16 }];

  // Bold header
  const headerRef = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws2[headerRef]) {
    ws2[headerRef].s = { font: { bold: true } };
  }
  const headerRef2 = XLSX.utils.encode_cell({ r: 0, c: 1 });
  if (ws2[headerRef2]) {
    ws2[headerRef2].s = { font: { bold: true } };
  }
  const headerRef3 = XLSX.utils.encode_cell({ r: 0, c: 2 });
  if (ws2[headerRef3]) {
    ws2[headerRef3].s = { font: { bold: true } };
  }

  XLSX.utils.book_append_sheet(wb, ws2, 'Distribución');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportInventoryReportToPdf(
  data: InventoryReportSummary,
  filename: string,
  companyName?: string,
): void {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Title bar (colored background) ──
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('Reporte de Inventario', pageWidth / 2, 12, { align: 'center' });

  if (companyName) {
    doc.setFontSize(9);
    doc.text(companyName, pageWidth / 2, 21, { align: 'center' });
  }

  // ── Sub-header: date ──
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text(`Fecha de corte: ${data.asOf}`, 14, 36);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })}`, pageWidth - 14, 36, { align: 'right' });

  // ── Section: Metric cards ──
  const cardW = (pageWidth - 28) / 3;
  const cardH = 22;
  const cardY = 44;
  const colors = [
    { bg: [219, 234, 254], text: [37, 99, 235] },  // blue
    { bg: [220, 252, 231], text: [22, 163, 74] },    // green
    { bg: [254, 249, 195], text: [202, 138, 4] },    // yellow
  ];
  const cards = [
    { label: 'Total productos', value: String(data.totalProducts) },
    { label: 'Con stock', value: String(data.inStock) },
    { label: 'Sin stock', value: String(data.outOfStock) },
  ];

  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 2);
    doc.setFillColor(colors[i].bg[0], colors[i].bg[1], colors[i].bg[2]);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');
    doc.setTextColor(colors[i].text[0], colors[i].text[1], colors[i].text[2]);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + cardW / 2, cardY + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + cardW / 2, cardY + 18, { align: 'center' });
  });

  // ── Section: Summary table ──
  const summaryY = cardY + cardH + 10;
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(0.5);
  doc.line(14, summaryY, pageWidth - 14, summaryY);
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen General', 14, summaryY + 5);

  const summaryRows = [
    ['Total de productos activos', String(data.totalProducts)],
    ['Productos con stock disponible', String(data.inStock)],
    ['Productos sin stock', String(data.outOfStock)],
    ['Productos con stock bajo (crítico)', String(data.lowStockCount)],
    ['Valor total del inventario', formatCurrency(data.inventoryValue)],
  ];

  const pctStock = data.totalProducts > 0
    ? ((data.inStock / data.totalProducts) * 100).toFixed(1)
    : '0.0';
  const pctOut = data.totalProducts > 0
    ? ((data.outOfStock / data.totalProducts) * 100).toFixed(1)
    : '0.0';
  const pctLow = data.totalProducts > 0
    ? ((data.lowStockCount / data.totalProducts) * 100).toFixed(1)
    : '0.0';

  const detailedRows = [
    ['Métrica', 'Cantidad', '% del total'],
    ['Total productos activos', String(data.totalProducts), '100%'],
    ['Con stock', String(data.inStock), `${pctStock}%`],
    ['Stock bajo (crítico)', String(data.lowStockCount), `${pctLow}%`],
    ['Sin stock', String(data.outOfStock), `${pctOut}%`],
    ['Valor inventario', formatCurrency(data.inventoryValue), '—'],
  ];

  autoTable(doc, {
    head: [detailedRows[0]],
    body: detailedRows.slice(1),
    startY: summaryY + 10,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 9, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      '0': { cellWidth: 80 },
      '1': { halign: 'center', cellWidth: 35 },
      '2': { halign: 'center', cellWidth: 30 },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `ESCRIBA POS — Reporte de Inventario — Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 8,
          { align: 'center' },
        );
      }
    },
  });

  doc.save(`${filename}.pdf`);
}

// ──────────────────────────────────────────────
// Blob helper
// ──────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Builds a download filename with the current date.
 */
export function buildExportFilename(prefix: string): string {
  return `${prefix}-${new Date().toISOString().split('T')[0]}`;
}
