import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../../services/attendanceService';
import { Clock, Plus, Trash2, Save } from 'lucide-react';
import { PageLoader } from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ defaultCheckInDeadline: '10:00', dayOverrides: {} });
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newTime, setNewTime] = useState('10:00');

  useEffect(() => { loadSettings(); }, []);
  const loadSettings = async () => { setLoading(true); const data = await getSettings(); setSettings(data); setLoading(false); };

  const handleSave = async () => {
    setSaving(true);
    try { await updateSettings(settings); toast.success('Settings saved!'); }
    catch { toast.error('Failed to save settings'); } finally { setSaving(false); }
  };

  const addOverride = () => {
    if (!newDate) return;
    setSettings(s => ({ ...s, dayOverrides: { ...s.dayOverrides, [newDate]: newTime } }));
  };

  const removeOverride = (date) => {
    setSettings(s => { const o = { ...s.dayOverrides }; delete o[date]; return { ...s, dayOverrides: o }; });
  };

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-5 max-w-xl">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4"><Clock size={16} className="text-brand-400" /><h3 className="text-sm font-semibold text-white">Default Check-In Deadline</h3></div>
        <p className="text-xs text-white/40 mb-3">Employees checking in after this time are marked <span className="text-amber-400">Late</span>. Those who never check in are marked <span className="text-red-400">Absent</span>.</p>
        <div className="flex items-center gap-3">
          <input type="time" value={settings.defaultCheckInDeadline} onChange={e => setSettings(s => ({ ...s, defaultCheckInDeadline: e.target.value }))} className="input w-36" />
          <span className="text-xs text-white/40">daily deadline</span>
        </div>
      </div>
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Day-Specific Overrides</h3>
        <p className="text-xs text-white/40 mb-4">Set a custom deadline for specific dates.</p>
        <div className="flex items-center gap-2 mb-4">
          <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="input flex-1" />
          <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="input w-32" />
          <button onClick={addOverride} className="btn-secondary flex items-center gap-1 text-sm whitespace-nowrap"><Plus size={14} /> Add</button>
        </div>
        <div className="space-y-2">
          {Object.entries(settings.dayOverrides || {}).length === 0
            ? <p className="text-xs text-white/30 py-3 text-center">No overrides set</p>
            : Object.entries(settings.dayOverrides).map(([date, time]) => (
            <div key={date} className="flex items-center justify-between bg-white/3 rounded-xl px-4 py-2.5">
              <span className="text-sm text-white">{date} → <span className="text-amber-400 font-medium">{time}</span></span>
              <button onClick={() => removeOverride(date)} className="text-white/20 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2"><Save size={15} />{saving ? 'Saving...' : 'Save Settings'}</button>
    </div>
  );
}