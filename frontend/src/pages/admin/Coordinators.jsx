import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const emptyForm = { name: '', email: '', password: '', assignedBatch: '' };

export default function AdminCoordinators() {
  const [coordinators, setCoordinators] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchCoordinators(); }, []);

  const fetchCoordinators = () =>
    api.get('/admin/coordinators').then(({ data }) => setCoordinators(data.coordinators));

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, email: c.email, password: '', assignedBatch: c.assignedBatch }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/admin/coordinators/${editing._id}`, form);
        toast.success('Coordinator updated');
      } else {
        await api.post('/admin/coordinators', form);
        toast.success('Coordinator created');
      }
      setShowModal(false);
      fetchCoordinators();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coordinator?')) return;
    await api.delete(`/admin/coordinators/${id}`);
    toast.success('Deleted');
    fetchCoordinators();
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const currentYear = new Date().getFullYear();
  const batches = Array.from({ length: 6 }, (_, i) => String(currentYear + i));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coordinators</h1>
          <p className="text-gray-500 text-sm mt-1">{coordinators.length} coordinator(s) managed</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add coordinator
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Email', 'Assigned batch', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coordinators.length === 0 && (
              <tr><td colSpan={4} className="text-center text-gray-400 py-10 text-sm">No coordinators yet</td></tr>
            )}
            {coordinators.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.email}</td>
                <td className="px-4 py-3">
                  <span className="badge-blue">Batch {c.assignedBatch}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{editing ? 'Edit coordinator' : 'Add coordinator'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={form.name} onChange={set('name')} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={set('email')} required />
              </div>
              <div>
                <label className="label">{editing ? 'New password (leave blank to keep)' : 'Password'}</label>
                <input type="password" className="input" value={form.password} onChange={set('password')} required={!editing} minLength={6} />
              </div>
              <div>
                <label className="label">Assigned batch</label>
                <select className="input" value={form.assignedBatch} onChange={set('assignedBatch')} required>
                  <option value="">Select batch</option>
                  {batches.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Saving...' : (editing ? 'Update' : 'Create')}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
