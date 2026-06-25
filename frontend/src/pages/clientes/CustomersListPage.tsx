import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Users, Search, Plus, X, Save, Loader2, Pencil, Building2,
  ChevronLeft, ChevronRight, Phone, Mail, User, CheckCircle, Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { ApiResponse, Customer } from '@/types';

interface CustomerForm {
  documentType: string;
  documentNumber: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customerType: string;
}

const emptyForm: CustomerForm = {
  documentType: 'CC',
  documentNumber: '',
  name: '',
  phone: '',
  email: '',
  address: '',
  customerType: 'RETAIL',
};

export default function CustomersListPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [showDetail, setShowDetail] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', user?.companyId, search, page],
    queryFn: () =>
      api.get<ApiResponse<{ content: Customer[]; totalElements: number }>>('/customers', {
        params: { companyId: user?.companyId, page, size: 25 },
      }),
    enabled: !!user?.companyId,
    refetchInterval: 30000,
  });

  const allCustomers = data?.data?.data?.content || [];
  const totalElements = data?.data?.data?.totalElements || 0;

  // Filter locally for better UX
  const customers = search
    ? allCustomers.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.documentNumber?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase())
      )
    : allCustomers;

  const openCreateForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setForm({
      documentType: customer.documentType?.code || 'CC',
      documentNumber: customer.documentNumber || '',
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      customerType: customer.customerType || 'RETAIL',
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return; }
    if (!form.documentNumber.trim()) { toast.error('El número de documento es requerido'); return; }

    setSaving(true);
    try {
      const payload = {
        companyId: user?.companyId,
        name: form.name,
        documentNumber: form.documentNumber,
        documentType: form.documentType,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
        customerType: form.customerType,
      };

      if (editingId) {
        await api.put(`/customers/${editingId}`, payload);
        toast.success('Cliente actualizado');
      } else {
        await api.post('/customers', payload);
        toast.success('Cliente creado');
      }

      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (customer: Customer) => {
    try {
      await api.put(`/customers/${customer.id}`, {
        companyId: user?.companyId,
        name: customer.name,
        documentNumber: customer.documentNumber,
        active: !customer.active,
      });
      toast.success(customer.active ? 'Cliente desactivado' : 'Cliente activado');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cambiar estado');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Clientes</h1>
          <p className="text-surface-500 mt-1">{allCustomers.length} clientes registrados</p>
        </div>
        <button onClick={openCreateForm} className="btn-primary">
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, NIT o CC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={48} className="mx-auto text-surface-300 mb-4" />
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
            {search ? 'Sin resultados' : 'No hay clientes'}
          </h3>
          <p className="text-surface-500 mb-4">
            {search ? `Ningún cliente coincide con "${search}"` : 'Aún no tienes clientes registrados.'}
          </p>
          {!search && (
            <button onClick={openCreateForm} className="btn-primary">
              <Plus size={16} /> Nuevo cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {customers.map((customer) => (
            <div key={customer.id} className="card-hover p-4">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                  onClick={() => setShowDetail(customer)}
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-surface-900 dark:text-white truncate">{customer.name}</h3>
                      <span className={cn('badge text-[10px]', customer.customerType === 'RETAIL' ? 'badge-info' : 'badge-success')}>
                        {customer.customerType === 'RETAIL' ? 'Minorista' : 'Mayorista'}
                      </span>
                      <span className={cn('badge text-[10px]', customer.active ? 'badge-success' : 'badge-neutral')}>
                        {customer.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5 flex-wrap">
                      <span>{customer.documentType?.name || 'ID'}: {customer.documentNumber}</span>
                      {customer.phone && <span>📞 {customer.phone}</span>}
                      {customer.email && <span>✉️ {customer.email}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right hidden sm:block mr-3">
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {formatCurrency(customer.totalPurchases)}
                    </p>
                    <p className="text-xs text-surface-400">en compras</p>
                  </div>
                  <button
                    onClick={() => openEditForm(customer)}
                    className="btn-ghost p-1.5"
                    title="Editar cliente"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(customer)}
                    className={cn('btn-ghost p-1.5', customer.active ? 'text-red-500' : 'text-green-500')}
                    title={customer.active ? 'Desactivar' : 'Activar'}
                  >
                    {customer.active ? <Ban size={14} /> : <CheckCircle size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalElements > 25 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-400">
            Mostrando {page * 25 + 1}-{Math.min((page + 1) * 25, totalElements)} de {totalElements}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="btn-ghost p-2">Anterior</button>
            <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * 25 >= totalElements} className="btn-ghost p-2">Siguiente</button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content w-[480px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">
                {editingId ? 'Editar cliente' : 'Nuevo cliente'}
              </h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo de ID</label>
                  <select
                    value={form.documentType}
                    onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                    className="input"
                  >
                    <option value="CC">CC</option>
                    <option value="NIT">NIT</option>
                    <option value="CE">CE</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="label">Número</label>
                  <input
                    type="text"
                    placeholder="123456789"
                    value={form.documentNumber}
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Nombre / Razón social</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Teléfono</label>
                  <input
                    type="text"
                    placeholder="3001234567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    placeholder="cliente@mail.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Dirección</label>
                <input
                  type="text"
                  placeholder="Cra 7 # 71-21"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Tipo de cliente</label>
                <select
                  value={form.customerType}
                  onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                  className="input"
                >
                  <option value="RETAIL">Minorista</option>
                  <option value="WHOLESALE">Mayorista</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content w-[450px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">{showDetail.name}</h2>
              <button onClick={() => setShowDetail(null)} className="btn-ghost p-1">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                  <Users size={28} className="text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-surface-900 dark:text-white text-lg">{showDetail.name}</h3>
                  <span className={cn('badge', showDetail.customerType === 'RETAIL' ? 'badge-info' : 'badge-success')}>
                    {showDetail.customerType === 'RETAIL' ? 'Minorista' : 'Mayorista'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                <div>
                  <p className="text-xs text-surface-400">Documento</p>
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {showDetail.documentType?.name || 'ID'}: {showDetail.documentNumber}
                  </p>
                </div>
                {showDetail.phone && (
                  <div>
                    <p className="text-xs text-surface-400">Teléfono</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{showDetail.phone}</p>
                  </div>
                )}
                {showDetail.email && (
                  <div className="col-span-2">
                    <p className="text-xs text-surface-400">Email</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{showDetail.email}</p>
                  </div>
                )}
                {showDetail.address && (
                  <div className="col-span-2">
                    <p className="text-xs text-surface-400">Dirección</p>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">{showDetail.address}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-surface-400">Total compras</p>
                  <p className="text-sm font-bold text-surface-900 dark:text-white">{formatCurrency(showDetail.totalPurchases)}</p>
                </div>
                {showDetail.creditLimit > 0 && (
                  <div>
                    <p className="text-xs text-surface-400">Límite de crédito</p>
                    <p className="text-sm font-bold text-surface-900 dark:text-white">{formatCurrency(showDetail.creditLimit)}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDetail(null); openEditForm(showDetail); }}
                  className="btn-secondary"
                >
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => setShowDetail(null)} className="btn-primary">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
