import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatDate, getInitials, cn } from '@/lib/utils';
import {
  Plus, Search, Building2, Phone, Mail, Star, MoreHorizontal,
  ChevronRight, Truck,
} from 'lucide-react';
import type { ApiResponse, Supplier } from '@/types';

export default function SupplierListPage() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', user?.companyId],
    queryFn: () =>
      api.get<ApiResponse<Supplier[]>>('/suppliers', {
        params: { companyId: user?.companyId },
      }),
    enabled: !!user?.companyId,
  });

  const suppliers = data?.data?.data || [];

  const filtered = search
    ? suppliers.filter(s =>
        s.businessName.toLowerCase().includes(search.toLowerCase()) ||
        (s.documentNumber || '').includes(search))
    : suppliers;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Proveedores</h1>
          <p className="text-surface-500 mt-1">{suppliers.length} proveedores registrados</p>
        </div>
        <Link to="/proveedores/nuevo" className="btn-primary">
          <Plus size={16} /> Nuevo proveedor
        </Link>
      </div>

      <div className="card p-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input type="text" placeholder="Busca por nombre, NIT o contacto..." value={search}
            onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Truck size={48} className="mx-auto mb-4 text-surface-300" />
          <h3 className="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
            {search ? 'Sin resultados' : 'No hay proveedores'}
          </h3>
          <p className="text-surface-500 mb-4">
            {search ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer proveedor'}
          </p>
          {!search && <Link to="/proveedores/nuevo" className="btn-primary"><Plus size={16} /> Nuevo proveedor</Link>}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(supplier => (
            <div key={supplier.id} className="card-hover p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {getInitials(supplier.businessName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-surface-900 dark:text-white truncate">{supplier.businessName}</h3>
                    {supplier.rating && (
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < supplier.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'} />
                        ))}
                      </div>
                    )}
                    <span className={cn('badge text-[10px]', supplier.active ? 'badge-success' : 'badge-neutral')}>
                      {supplier.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-surface-500">
                    {supplier.documentNumber && <span>NIT {supplier.documentNumber}</span>}
                    {supplier.phone && <span className="flex items-center gap-1"><Phone size={12} />{supplier.phone}</span>}
                    {supplier.email && <span className="flex items-center gap-1"><Mail size={12} />{supplier.email}</span>}
                    {supplier.paymentTerm && (
                      <span className="badge-neutral text-[10px]">
                        {supplier.paymentTerm === 'CASH' ? 'Contado' : supplier.paymentTerm}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/proveedores/ordenes/nueva?proveedor=${supplier.id}`}
                    className="btn-secondary text-xs py-1.5 px-3" title="Nueva orden">
                    <Plus size={14} /> Orden
                  </Link>
                  <Link to={`/proveedores/${supplier.id}`} className="btn-ghost p-2">
                    <ChevronRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
