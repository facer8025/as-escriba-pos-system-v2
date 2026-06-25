import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import { formatCurrency, getInitials } from '@/lib/utils';
import { ArrowLeft, Building2, Edit, Phone, Mail, MapPin, ShoppingCart, Star } from 'lucide-react';
import type { ApiResponse, Supplier } from '@/types';

export default function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => api.get<ApiResponse<Supplier>>(`/suppliers/${id}`),
    enabled: !!id,
  });

  const s = data?.data?.data;
  if (!s) return <div className="text-center py-12 text-surface-400">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/proveedores')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/proveedores/ordenes/nueva?proveedor=${s.id}`)} className="btn-primary"><ShoppingCart size={16} /> Crear orden</button>
        <button className="btn-secondary"><Edit size={16} /> Editar</button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Info */}
        <div className="card p-6">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-4">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">{getInitials(s.businessName)}</span>
          </div>
          <h2 className="text-lg font-bold">{s.businessName}</h2>
          {s.tradeName && <p className="text-sm text-surface-400">{s.tradeName}</p>}
          {s.rating && (
            <div className="flex items-center gap-0.5 mt-2">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className={i < s.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-surface-300'} />)}
            </div>
          )}

          <div className="space-y-3 mt-6 text-sm">
            {s.documentNumber && <div className="flex items-center gap-2"><Building2 size={14} className="text-surface-400" /><span>NIT {s.documentNumber}</span></div>}
            {s.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-surface-400" /><span>{s.phone}</span></div>}
            {s.email && <div className="flex items-center gap-2"><Mail size={14} className="text-surface-400" /><span>{s.email}</span></div>}
            <div className="flex items-center gap-2"><MapPin size={14} className="text-surface-400" /><span>{s.city?.name || '—'}</span></div>
          </div>

          <div className="mt-6 pt-4 border-t text-sm">
            <div className="flex justify-between"><span className="text-surface-400">Plazo de pago</span><span>{s.paymentTerm === 'CASH' ? 'Contado' : s.paymentTerm}</span></div>
          </div>
        </div>

        {/* Right - Orders & Products */}
        <div className="col-span-2 space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Órdenes de compra</h3>
            <p className="text-sm text-surface-400 text-center py-8">Este proveedor no tiene órdenes registradas</p>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Productos suministrados</h3>
            <p className="text-sm text-surface-400 text-center py-8">Sin productos asociados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
