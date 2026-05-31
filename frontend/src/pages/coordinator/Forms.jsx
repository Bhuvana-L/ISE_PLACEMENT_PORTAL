import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import FormBuilder from '../../components/FormBuilder';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, FileText } from 'lucide-react';

const emptyForm = { title: '', description: '', deadline: '', fields: [] };

export default function CoordForms() {
  const [forms, setForms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchForms(); }, []);

  const fetchForms = () =>
    api.get('/coordinator/forms').then(({ data }) => setForms(data.forms));

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (f) => {
    setEditing(f);
    setForm({ title: f.title, description: f.description || '', deadline: f.deadline?.slice(0, 10) || '', fields: f.fields });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fields.length === 0) return toast.error('Add at least one field');
    setLoading(true);
    try {
      if (editing) {
        await api.put(`/coordinator/forms/${editing._id}`, form);
        toast.success('Form updated');
      } else {
        await api.post('/coordinator/forms', form);
        toast.success('Form created');
      }
      setShowModal(false);
      fetchForms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  const toggleOpen = async (f) => {
    await api.put(`/coordinator/forms/${f._id}`, { isOpen: !f.isOpen });
    fetchForms();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this form?')) return;
    await api.delete(`/coordinator/forms/${id}`);
    toast.success('Deleted');
    fetchForms();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-500 text-sm mt-1">{forms.length} form(s)</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create form
        </button>
      </div>

      {forms.length === 0 && (
        <div className="card text-center py-16 text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-30" />
          <p>No forms yet. Create your first form.</p>
        </div>
      )}

      <div className="space-y-3">
        {forms.map((f) => (
          <div key={f._id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{f.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {f.fields.length} fields · Created {new Date(f.createdAt).toLocaleDateString()}
                {f.deadline ? ` · Deadline ${new Date(f.deadline).toLocaleDateString()}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={f.isOpen ? 'badge-green' : 'badge-red'}>{f.isOpen ? 'Open' : 'Closed'}</span>
              <button onClick={() => toggleOpen(f)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Toggle open/closed">
                {f.isOpen ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
              <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition">
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(f._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-lg">{editing ? 'Edit form' : 'Create form'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Form title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="e.g. Placement Registration Form" />
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Instructions for students..." />
              </div>
              <div>
                <label className="label">Deadline (optional)</label>
                <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div>
                <label className="label">Form fields</label>
                <FormBuilder fields={form.fields} onChange={(fields) => setForm({ ...form, fields })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Saving...' : editing ? 'Update form' : 'Create form'}
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
