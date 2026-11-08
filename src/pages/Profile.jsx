import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Check,
  ChevronRight,
  Download,
  Dumbbell,
  Moon,
  Palette,
  Sun,
  Trash2,
  Upload,
  UserRound,
  Volume2,
  Vibrate,
  Wrench,
} from 'lucide-react';
import { loadSettings, saveSettings, loadActiveSession, loadAllProgramWeeks, loadProgramCycleStarts, restoreLocalState, clearLocalData } from '@/lib/storage';
import { PROGRAM_LIST } from '@/lib/programData';
import { ACCENT_LIST, applyAppearance } from '@/lib/appearance';
import { useDeleteAllSessions, useDeleteAllCustomWorkouts } from '@/hooks/useTrainingData';
import { listCustomWorkouts, listSessions, listBodyweightEntries, replaceAllTrainingData, deleteAllBodyweightEntries } from '@/lib/localDatabase';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

const EQUIPMENT_OPTIONS = ['Parallettes', 'Rings', 'Pull-up bar', 'Resistance bands', 'Dumbbells', 'Backpack', 'Weight belt', 'Wall', 'Bench / stable chair', 'Step / box'];

export default function Profile() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(loadSettings());
  const [clearing, setClearing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();
  const { mutateAsync: deleteAllSessions } = useDeleteAllSessions();
  const { mutateAsync: deleteAllCustomWorkouts } = useDeleteAllCustomWorkouts();

  const update = (patch) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    if ('theme' in patch || 'accent' in patch) applyAppearance(next);
  };

  const toggleEquipment = (item) => {
    const equipment = settings.equipment || [];
    update({ equipment: equipment.includes(item) ? equipment.filter((entry) => entry !== item) : [...equipment, item] });
  };

  const changeUnits = (units) => {
    if (units === settings.units) return;
    const currentWeight = Number(settings.bodyweight);
    const convertedWeight = Number.isFinite(currentWeight) && currentWeight > 0
      ? Number((units === 'lb' ? currentWeight * 2.2046226218 : currentWeight / 2.2046226218).toFixed(1))
      : settings.bodyweight;
    update({ units, bodyweight: convertedWeight });
  };

  const selectProgram = (programId) => {
    if (programId === settings.activeProgram) return;
    update({ activeProgram: programId });
    toast({ title: 'Training plan updated', description: 'Your selected program is now active. Your previous program data is preserved.' });
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const [sessions, customWorkouts, bodyweightEntries] = await Promise.all([listSessions(), listCustomWorkouts(), listBodyweightEntries()]);
      const data = {
        app: 'APEX',
        formatVersion: 3,
        sessions,
        customWorkouts,
        bodyweightEntries,
        settings: loadSettings(),
        programWeeks: loadAllProgramWeeks(),
        programCycleStarts: loadProgramCycleStarts(),
        activeSession: loadActiveSession(),
        exportedAt: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `apex-backup-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      toast({ title: 'Backup exported', description: `${sessions.length} sessions, ${customWorkouts.length} routines and ${bodyweightEntries.length} weigh-ins saved.` });
    } catch (error) {
      toast({ title: 'Backup failed', description: error.message || 'Could not read local training data.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);
    try {
      const backup = JSON.parse(await file.text());
      if (!backup || typeof backup !== 'object' || !Array.isArray(backup.sessions) || !Array.isArray(backup.customWorkouts)) {
        throw new Error('This file is not a valid APEX backup.');
      }
      const confirmed = window.confirm(`Replace current local data with this backup?\n\n${backup.sessions.length} workout sessions, ${backup.customWorkouts.length} custom workouts and ${(backup.bodyweightEntries || []).length} weigh-ins will be imported. This cannot be undone.`);
      if (!confirmed) return;
      await replaceAllTrainingData(backup);
      clearLocalData();
      restoreLocalState(backup);
      await queryClient.invalidateQueries();
      const restored = loadSettings();
      setSettings(restored);
      applyAppearance(restored);
      toast({ title: 'Backup imported', description: 'Your local APEX data has been restored.' });
    } catch (error) {
      toast({ title: 'Import failed', description: error.message || 'Could not read this backup file.', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const doClear = async () => {
    if (!window.confirm('Delete all sessions, custom workouts, settings and local data? This cannot be undone.')) return;
    setClearing(true);
    try {
      await Promise.all([deleteAllSessions(), deleteAllCustomWorkouts(), deleteAllBodyweightEntries()]);
      clearLocalData();
      const reset = loadSettings();
      setSettings(reset);
      applyAppearance(reset);
      await queryClient.invalidateQueries();
      toast({ title: 'Local data cleared', description: 'Your APEX training history and preferences were removed.' });
    } catch (error) {
      toast({ title: 'Could not clear data', description: error.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setClearing(false);
    }
  };


  return (
    <div className="apex-page px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-5">
      <header className="flex items-center gap-3 pt-1 pb-7">
        <div className="apex-brand-mark" aria-hidden="true">A</div>
        <div>
          <p className="apex-overline">APEX <span>/</span> PREFERENCES</p>
          <h1 className="mt-1 text-[1.7rem] font-bold leading-none tracking-tight">Settings</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">Shape the app around how you train.</p>
        </div>
      </header>

      <section className="apex-settings-intro mb-6">
        <div className="flex items-center gap-3">
          <div className="apex-settings-avatar"><UserRound size={21} /></div>
          <div className="min-w-0 flex-1">
            <label htmlFor="athlete-name" className="apex-overline">ATHLETE PROFILE</label>
            <input
              id="athlete-name"
              value={settings.athleteName}
              onChange={(event) => update({ athleteName: event.target.value })}
              placeholder="Your name"
              className="apex-name-input"
            />
          </div>
        </div>
        <div className="mt-4 border-t border-border/70 pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-muted-foreground">Bodyweight</span>
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Used in training records</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={settings.bodyweight}
              onChange={(event) => update({ bodyweight: event.target.value === '' ? '' : Number(event.target.value) })}
              className="apex-number-input min-w-0 flex-1"
              aria-label="Bodyweight"
            />
            <UnitToggle value={settings.units} onChange={changeUnits} />
          </div>
        </div>
      </section>

      <SettingsSection icon={Activity} title="Training plan" subtitle="Your program sets the structure. Daily adjustments won't rewrite it.">
        <div className="space-y-2">
          {PROGRAM_LIST.map((program) => {
            const selected = settings.activeProgram === program.id;
            return (
              <button
                key={program.id}
                type="button"
                onClick={() => selectProgram(program.id)}
                aria-pressed={selected}
                className={`apex-program-option ${selected ? 'is-selected' : ''}`}
              >
                <span className="apex-program-icon"><Dumbbell size={17} /></span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {program.name}
                    {selected && <span className="apex-current-badge"><Check size={10} /> ACTIVE</span>}
                  </span>
                  <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">{program.blurb}</span>
                </span>
                <span className={`apex-radio ${selected ? 'is-selected' : ''}`}>{selected && <span />}</span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => navigate('/plan')} className="apex-settings-link mt-3">
          View weekly schedule <ChevronRight size={15} />
        </button>
      </SettingsSection>

      <SettingsSection icon={Dumbbell} title="Available equipment" subtitle="Workouts replace or remove movements when your equipment is unavailable.">
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((item) => {
            const selected = (settings.equipment || []).includes(item);
            return (
              <button key={item} type="button" onClick={() => toggleEquipment(item)} aria-pressed={selected} className={`apex-equipment-chip ${selected ? 'is-selected' : ''}`}>
                {selected && <Check size={12} />}{item}
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection icon={Volume2} title="Training preferences" subtitle="Small details that make sessions feel right.">
        <div className="divide-y divide-border/70">
          <ToggleRow label="Workout notifications" description="Reminders for planned sessions" value={settings.notifications} onChange={(value) => update({ notifications: value })} />
          <ToggleRow label="Interface sounds" description="Soft cues for selections and completed sets" value={settings.interfaceSound} onChange={(value) => update({ interfaceSound: value })} />
          <ToggleRow label="Interface haptics" description="Subtle feedback for key actions" value={settings.interfaceHaptics} onChange={(value) => update({ interfaceHaptics: value })} icon={Vibrate} />
          <ToggleRow label="Rest timer sound" description="Play a sound when rest ends" value={settings.restSound} onChange={(value) => update({ restSound: value })} />
          <ToggleRow label="Rest timer vibration" description="Vibrate when rest ends" value={settings.restVibration} onChange={(value) => update({ restVibration: value })} icon={Vibrate} />
          <ToggleRow label="Reduce motion" description="Use fewer interface animations" value={settings.reduceMotion} onChange={(value) => update({ reduceMotion: value })} icon={Activity} />
        </div>
      </SettingsSection>

      <SettingsSection icon={Palette} title="Appearance" subtitle="Keep it comfortable and easy to read.">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Theme</p>
          <div className="grid grid-cols-2 gap-2">
            <ThemeOption label="Dark" selected={settings.theme === 'dark'} icon={Moon} onClick={() => update({ theme: 'dark' })} />
            <ThemeOption label="Light" selected={settings.theme === 'light'} icon={Sun} onClick={() => update({ theme: 'light' })} />
          </div>
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Accent colour</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {ACCENT_LIST.map((accent) => {
              const selected = settings.accent === accent.key;
              return (
                <button
                  key={accent.key}
                  type="button"
                  aria-label={`${accent.label} accent`}
                  aria-pressed={selected}
                  onClick={() => update({ accent: accent.key })}
                  className={`apex-accent-option ${selected ? 'is-selected' : ''}`}
                >
                  <span className="apex-accent-swatch" style={{ background: accent.color }}>{selected && <Check size={14} color={accent.fg} strokeWidth={3} />}</span>
                  <span>{accent.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={Wrench} title="Tools" subtitle="Utilities for building your own training sessions.">
        <button type="button" onClick={() => navigate('/build')} className="apex-settings-action">
          <span className="apex-action-icon"><Dumbbell size={17} /></span>
          <span className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold">Routine builder</span><span className="mt-0.5 block text-[11px] text-muted-foreground">Create and save a custom workout</span></span>
          <ChevronRight size={17} className="text-muted-foreground" />
        </button>
      </SettingsSection>

      <SettingsSection icon={Download} title="Data & backups" subtitle="Your training data lives in this browser. Export a backup before changing devices or clearing site data.">
        <button type="button" onClick={doExport} disabled={exporting} className="apex-settings-action">
          <span className="apex-action-icon"><Download size={17} /></span>
          <span className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold">{exporting ? 'Preparing backup…' : 'Export backup'}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">Download your workouts and settings as JSON</span></span>
          <ChevronRight size={17} className="text-muted-foreground" />
        </button>
        <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImportFile} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing} className="apex-settings-action mt-2">
          <span className="apex-action-icon"><Upload size={17} /></span>
          <span className="min-w-0 flex-1 text-left"><span className="block text-sm font-semibold">{importing ? 'Importing backup…' : 'Restore backup'}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">Replace local data with a previous backup</span></span>
          <ChevronRight size={17} className="text-muted-foreground" />
        </button>
        <button type="button" onClick={doClear} disabled={clearing} className="apex-settings-danger mt-3">
          <Trash2 size={16} /> {clearing ? 'Clearing data…' : 'Clear all local data'}
        </button>
      </SettingsSection>

      <div className="mt-8 flex items-center justify-between border-t border-border/70 pt-4 text-[10px] text-muted-foreground">
        <span>APEX · PERSONAL CALISTHENICS</span>
        <span>OFFLINE-FIRST</span>
      </div>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="apex-settings-section">
      <div className="mb-3 flex items-start gap-3">
        <span className="apex-settings-section-icon"><Icon size={16} /></span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="apex-settings-card">{children}</div>
    </section>
  );
}

function UnitToggle({ value, onChange }) {
  return (
    <div className="apex-unit-toggle" aria-label="Weight unit">
      {['kg', 'lb'].map((unit) => (
        <button key={unit} type="button" onClick={() => onChange(unit)} aria-pressed={value === unit} className={value === unit ? 'is-selected' : ''}>{unit}</button>
      ))}
    </div>
  );
}

function ToggleRow({ label, description, value, onChange, icon: Icon = Check }) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={!!value} aria-label={label} onClick={() => onChange(!value)} className={`apex-switch ${value ? 'is-on' : ''}`}>
        <span />
      </button>
    </div>
  );
}

function ThemeOption({ label, selected, icon: Icon, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={`apex-theme-option ${selected ? 'is-selected' : ''}`}>
      <Icon size={17} />
      <span>{label}</span>
      {selected && <Check size={14} className="ml-auto" />}
    </button>
  );
}
