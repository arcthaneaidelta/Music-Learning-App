import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Kbd } from '../../components/ui/Kbd';
import { useProjectStore } from '../../state/projectStore';

export const ShortcutsOverlay: React.FC = () => {
  const { activeSheet, setActiveSheet } = useProjectStore();
  const isOpen = activeSheet === 'shortcuts';
  const onClose = () => setActiveSheet(null);

  const shortcuts = [
    { key: <Kbd>Space</Kbd>, desc: 'Play / Pause audio' },
    { key: <Kbd>M</Kbd>, desc: 'Drop marker at current position' },
    { key: <Kbd>L</Kbd>, desc: 'Toggle / clear loop' },
    {
      key: (
        <div className="flex gap-1">
          <Kbd>[</Kbd>
          <Kbd>]</Kbd>
        </div>
      ),
      desc: 'Step playback speed ±5%',
    },
    {
      key: (
        <div className="flex gap-1">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </div>
      ),
      desc: 'Step ±1 beat',
    },
    {
      key: (
        <div className="flex gap-1">
          <Kbd>Shift</Kbd>
          <span>+</span>
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </div>
      ),
      desc: 'Step ±1 bar',
    },
    { key: <Kbd>S</Kbd>, desc: 'Cycle Snap (Bar → Beat → Off)' },
    { key: <Kbd>C</Kbd>, desc: 'Toggle Metronome click' },
    { key: <Kbd>?</Kbd>, desc: 'Open shortcuts guide' },
  ];

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-ink/30" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md bg-surface-elevated border border-border rounded-lg p-6 shadow-3">
        <h3 className="text-lg font-medium font-display text-ink tracking-tight mb-1">
          Keyboard Shortcuts
        </h3>
        <p className="text-xs font-ui text-ink-3 mb-4">
          All timeline and playback actions can be driven directly via keyboard.
        </p>

        <div className="flex flex-col divide-y divide-border border border-border rounded-md overflow-hidden bg-surface text-xs font-ui mb-5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 hover:bg-surface-sunken/50"
            >
              <span className="text-ink-2">{s.desc}</span>
              <div className="shrink-0">{s.key}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-hover active:scale-98"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
