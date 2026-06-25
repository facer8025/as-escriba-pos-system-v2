import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Loader2, Building2, Plus, X } from 'lucide-react';

export default function SupplierFormPage() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({
    businessName: '', documentNumber: '', phone: '', email: '',
    address: '', contactName: '', paymentTerm: 'CASH', active: true,
  });
  const [contacts, setContacts] = useState([{ name: '', role: '', phone: '', email: '' }]);

  const mutation = useMutation({
    mutationFn: () => api.post('/suppliers', { ...form, companyId: user?.companyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success(isEditing ? 'Proveedor actualizado' : 'Proveedor creado');
      navigate('/proveedores');
    },
    onError: () => toast.error('Error al guardar'),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/proveedores')} className="btn-ghost p-2"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar proveedor' : 'Nuevo proveedor'}</h1>
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-surface-200">
          {['general', 'contacts'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all -mb-px ${tab === t ? 'border-primary-500 text-primary-600 dark:text-primary-300' : 'border-transparent text-surface-500 dark:text-surface-400'}`}>
              {t === 'general' ? 'Datos generales' : 'Contactos'}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {tab === 'general' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Razón social *</label>
                <input value={form.businessName} onChange={e => setForm({...form, businessName: e.target.value})} className="input" /></div>
              <div><label className="label">NIT / CC</label>
                <input value={form.documentNumber} onChange={e => setForm({...form, documentNumber: e.target.value})} className="input" /></div>
              <div><label className="label">Teléfono</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" /></div>
              <div className="col-span-2"><label className="label">Email</label>
                <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" /></div>
              <div className="col-span-2"><label className="label">Dirección</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="input" /></div>
              <div><label className="label">Contacto principal</label>
                <input value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} className="input" /></div>
              <div><label className="label">Plazo de pago</label>
                <select value={form.paymentTerm} onChange={e => setForm({...form, paymentTerm: e.target.value})} className="input">
                  <option value="CASH">Contado</option>
                  <option value="D15">15 días</option>
                  <option value="D30">30 días</option>
                  <option value="D60">60 días</option>
                </select></div>
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-4">
              {contacts.map((c, i) => (
                <div key={i} className="card p-4 bg-surface-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contacto #{i + 1}</span>
                    {contacts.length > 1 && (
                      <button onClick={() => setContacts(contacts.filter((_, j) => j !== i))} className="btn-ghost p-1 text-red-500"><X size={14} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Nombre completo" value={c.name} onChange={e => {
                      const nc = [...contacts]; nc[i].name = e.target.value; setContacts(nc);
                    }} className="input" />
                    <input placeholder="Cargo" value={c.role} onChange={e => {
                      const nc = [...contacts]; nc[i].role = e.target.value; setContacts(nc);
                    }} className="input" />
                    <input placeholder="Teléfono" value={c.phone} onChange={e => {
                      const nc = [...contacts]; nc[i].phone = e.target.value; setContacts(nc);
                    }} className="input" />
                    <input placeholder="Email" value={c.email} onChange={e => {
                      const nc = [...contacts]; nc[i].email = e.target.value; setContacts(nc);
                    }} className="input" />
                  </div>
                </div>
              ))}
              <button onClick={() => setContacts([...contacts, { name: '', role: '', phone: '', email: '' }])}
                className="btn-secondary"><Plus size={16} /> Agregar contacto</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={() => navigate('/proveedores')} className="btn-secondary">Cancelar</button>
        <button onClick={() => mutation.mutate()} disabled={!form.businessName || mutation.isPending} className="btn-primary">
          {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isEditing ? 'Guardar cambios' : 'Crear proveedor'}
        </button>
      </div>
    </div>
  );
}
