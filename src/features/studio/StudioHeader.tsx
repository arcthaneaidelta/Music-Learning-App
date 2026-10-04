import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileJson,
  Sliders,
  Activity,
  RotateCcw,
  HelpCircle,
  Edit2,
  PowerOff,
} from 'lucide-react';
import { useProjectStore } from '../../state/projectStore';
import { useToast } from '../../components/ui/Toast';
import { formatRelativeTime } from '../../lib/format';

export const StudioHeader: React.FC = () => {
  const {
    project,
    saveStatus,
    lastSavedAt,
    updateTitle,
    setActiveSheet,
    simulateAppKill,
  } = useProjectStore();

  const { showToast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);

  const handleSaveTitle = () => {
    if (titleInput.trim()) {
      updateTitle(titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleSimulateKill = async () => {
    setIsMenuOpen(false);
    showToast({ type: 'info', text: 'Simulating app kill & state flush...' });
    await simulateAppKill();
  };

  return (
    <header className="relative h-14 w-full bg-surface border-b border-border px-3 sm:px-4 flex items-center justify-between z-nav select-none">
      {/* Back to Library */}
      <Link
        to="/studio"
        className="flex items-center gap-1 text-xs font-ui font-medium text-ink-2 hover:text-ink transition-colors p-1.5 -ml-1 rounded-md hover:bg-surface-sunken"
        title="Back to Projects Library"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden xs:inline">Library</span>
      </Link>

      {/* Project Title (Editable) */}
      <div className="flex-1 max-w-[200px] sm:max-w-xs mx-2 flex justify-center">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            autoFocus
            className="w-full text-center px-2 py-0.5 text-xs sm:text-sm font-semibold text-ink bg-white border border-border-strong rounded"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleInput(project.title);
              setIsEditingTitle(true);
            }}
            className="flex items-center gap-1 text-xs sm:text-sm font-display font-medium text-ink hover:text-primary truncate max-w-full group"
            title="Click to rename project"
          >
            <span className="truncate">{project.title}</span>
            <Edit2 className="w-3 h-3 text-ink-3 opacity-0 group-hover:opacity-100 shrink-0" />
          </button>
        )}
      </div>

      {/* Right: Save Status & Overflow Menu */}
      <div className="flex items-center gap-2">
        {/* Save Status Chip */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-ink-3">
          {saveStatus === 'saved' && (
            <>
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>Saved · {formatRelativeTime(lastSavedAt || project.updatedAt)}</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <span className="w-2 h-2 rounded-full bg-warning animate-ping" />
              <span>Saving…</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <span className="w-2 h-2 rounded-full bg-error" />
              <span className="text-error">Couldn't save</span>
            </>
          )}
        </div>

        {/* Overflow Menu Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md hover:bg-surface-sunken text-ink-2 hover:text-ink transition-colors"
            title="Project options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-56 bg-surface-elevated border border-border rounded-lg shadow-2 py-1.5 z-40 text-xs font-ui text-ink divide-y divide-border/60">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveSheet('beat');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-sunken flex items-center gap-2.5"
                  >
                    <Sliders className="w-4 h-4 text-primary" />
                    <span>Set the Beat & Tempo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveSheet('markers');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-sunken flex items-center gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>Manage Markers ({project.markers.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveSheet('map');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-sunken flex items-center gap-2.5"
                  >
                    <FileJson className="w-4 h-4 text-primary" />
                    <span>View Timing Map (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveSheet('sync');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-sunken flex items-center gap-2.5"
                  >
                    <Activity className="w-4 h-4 text-accent" />
                    <span>Sync & Proof Tools</span>
                  </button>
                </div>

                {/* The Milestone Highlight Test: Simulate App Kill */}
                <div className="py-1 bg-accent/5">
                  <button
                    type="button"
                    onClick={handleSimulateKill}
                    className="w-full px-3 py-2 text-left hover:bg-accent-soft text-accent font-semibold flex items-center gap-2.5"
                    title="Simulate app termination and test instant millisecond restoration"
                  >
                    <PowerOff className="w-4 h-4 text-accent" />
                    <span>Simulate App Kill & Restore</span>
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveSheet('shortcuts');
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-surface-sunken flex items-center gap-2.5 text-ink-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Keyboard Shortcuts (?)</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
