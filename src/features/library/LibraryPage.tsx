import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listProjects, deleteProject, saveProject, saveAudioBlob } from '../../persistence/db';
import { ProjectData, DEFAULT_HARBOUR_LIGHT_PROJECT, REGION_COLORS } from '../../persistence/schema';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { AudioEngine } from '../../audio/AudioEngine';
import { formatTime, formatRelativeTime } from '../../lib/format';
import { generateId } from '../../lib/ids';
import {
  Upload,
  Music,
  Plus,
  MoreVertical,
  Trash2,
  Copy,
  Download,
  Sparkles,
  ArrowRight,
  FileAudio,
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const engine = AudioEngine.getInstance();

  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDecoding, setIsDecoding] = useState(false);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<ProjectData | null>(null);
  const [showBanner, setShowBanner] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = async () => {
    setIsLoading(true);
    const list = await listProjects();
    setProjects(list);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // F1: Local Audio Import
  const handleFileSelected = async (file: File) => {
    if (!file) return;

    if (file.size > 60 * 1024 * 1024) {
      showToast({
        type: 'error',
        text: 'That file is large for a browser demo (limit 60 MB).',
      });
      return;
    }

    setIsDecoding(true);
    try {
      const ctx = await engine.ensureContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const id = generateId('prj');
      const title = file.name.replace(/\.[^/.]+$/, '');
      const duration = Math.round(audioBuffer.duration * 100) / 100;

      const newProject: ProjectData = {
        schemaVersion: 1,
        id,
        title,
        audio: {
          name: file.name,
          duration,
          sampleRate: audioBuffer.sampleRate,
          fingerprint: `len:${audioBuffer.length}|rate:${audioBuffer.sampleRate}`,
          isCustomUpload: true,
        },
        tempoMap: [{ time: 0, bpm: 120, meter: [4, 4] }],
        downbeatOffset: 0.0,
        regions: [
          {
            id: generateId('r'),
            name: 'Section 1',
            start: 0,
            end: Math.min(duration, 16),
            color: REGION_COLORS[0],
          },
        ],
        markers: [],
        session: {
          position: 0,
          rate: 1.0,
          loop: null,
          snap: 'bar',
          zoom: 1.0,
          metronome: false,
          countIn: false,
          hearScrub: true,
        },
        updatedAt: new Date().toISOString(),
      };

      // Save project metadata and raw audio blob to IndexedDB
      await saveAudioBlob(id, file);
      await saveProject(newProject);

      showToast({
        type: 'success',
        text: `Imported '${file.name}' · ${formatTime(duration, false)}`,
      });

      // Auto-open Studio with "Set the beat" hint
      navigate(`/studio/${id}`);
    } catch (err) {
      console.error('File decode failed:', err);
      showToast({
        type: 'error',
        text: "We couldn't read that file. Try MP3, WAV, or M4A.",
      });
    } finally {
      setIsDecoding(false);
    }
  };

  const handleDeleteProject = async (project: ProjectData) => {
    await deleteProject(project.id);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    showToast({
      type: 'undo',
      text: `Removed "${project.title}"`,
      undoAction: async () => {
        await saveProject(project);
        fetchProjects();
      },
    });
  };

  const handleDuplicateProject = async (project: ProjectData) => {
    const newId = generateId('prj');
    const duplicated: ProjectData = {
      ...project,
      id: newId,
      title: `${project.title} (Copy)`,
      updatedAt: new Date().toISOString(),
    };
    await saveProject(duplicated);
    fetchProjects();
    showToast({ type: 'success', text: `Duplicated "${project.title}"` });
  };

  const handleExportJson = (project: ProjectData) => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id}.metre.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', text: `Exported ${project.id}.metre.json` });
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col selection:bg-accent-soft">
      {/* Top Navbar */}
      <header className="h-16 w-full border-b border-border bg-surface px-4 sm:px-8 flex items-center justify-between sticky top-0 z-nav">
        <Link to="/" className="inline-block">
          <Logo size="md" />
        </Link>
        <div className="flex items-center gap-4 text-xs font-ui">
          <Link
            to="/architecture"
            className="text-ink-2 hover:text-ink transition-colors hidden sm:inline"
          >
            Architecture
          </Link>
          <Link
            to="/proposal"
            className="text-ink-2 hover:text-ink transition-colors hidden sm:inline"
          >
            Proposal
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload className="w-3.5 h-3.5" />}
          >
            Import audio
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6 flex-1">
        {/* Milestone Verification Suggestion Banner */}
        {showBanner && (
          <div className="p-4 bg-surface rounded-lg border border-border flex items-start justify-between gap-4 shadow-1">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink font-ui">
                  Milestone Verification Flow
                </h4>
                <p className="text-xs sm:text-sm text-ink-2 mt-1 leading-relaxed">
                  <strong>Try this:</strong> open "Harbour Light", loop the Chorus at 70% speed, then choose{' '}
                  <span className="font-mono bg-surface-sunken px-1.5 py-0.5 rounded border border-border">
                    ⋯ → Simulate app kill
                  </span>
                  . The app reloads and restores exact millisecond position, loop bounds, and speed.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="text-xs text-ink-3 hover:text-ink font-ui uppercase"
            >
              ✕
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-medium text-ink">
              Your Projects
            </h1>
            <p className="text-xs sm:text-sm text-ink-3 mt-1 font-ui">
              Sample-accurate timing maps and audio stored locally on this device.
            </p>
          </div>
        </div>

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*,.mp3,.wav,.m4a"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelected(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const isSample = p.id === 'harbour-light';
            const durationFormatted = formatTime(p.audio.duration, false);

            return (
              <div
                key={p.id}
                className="group relative flex flex-col justify-between p-5 bg-surface hover:bg-surface-elevated border border-border hover:border-border-strong rounded-lg shadow-1 transition-all duration-150 cursor-pointer"
                onClick={() => navigate(`/studio/${p.id}`)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-surface-sunken text-ink-2 border border-border">
                      {p.tempoMap[0]?.bpm || 96} BPM · 4/4
                    </span>

                    {/* Kebab Options Menu */}
                    <div
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleDuplicateProject(p)}
                        className="p-1 text-ink-3 hover:text-ink rounded mr-1"
                        title="Duplicate"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportJson(p)}
                        className="p-1 text-ink-3 hover:text-ink rounded mr-1"
                        title="Export JSON"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {!isSample && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmProject(p)}
                          className="p-1 text-ink-3 hover:text-error rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-lg font-display font-medium text-ink group-hover:text-primary transition-colors truncate">
                    {p.title}
                  </h3>

                  <div className="text-xs font-mono text-ink-3 mt-1">
                    {durationFormatted} · {p.regions.length} sections · {p.markers.length} markers
                  </div>

                  {/* Section Visual Bar */}
                  <div className="w-full h-2 rounded bg-surface-sunken overflow-hidden flex my-3">
                    {p.regions.map((r, i) => (
                      <div
                        key={i}
                        className="h-full"
                        style={{
                          width: `${((r.end - r.start) / p.audio.duration) * 100}%`,
                          backgroundColor: r.color,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-ui text-ink-3">
                  <span>Last edited {formatRelativeTime(p.updatedAt)}</span>
                  <span className="text-primary font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Open <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}

          {/* Import Drop Zone Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-primary', 'bg-surface-sunken');
            }}
            onDragLeave={(e) => {
              e.currentTarget.classList.remove('border-primary', 'bg-surface-sunken');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-primary', 'bg-surface-sunken');
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelected(e.dataTransfer.files[0]);
              }
            }}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border-strong hover:border-primary bg-surface/50 hover:bg-surface rounded-lg cursor-pointer transition-all min-h-[200px] text-center group"
          >
            {isDecoding ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-xs font-medium font-ui text-ink">Decoding audio file...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-surface-sunken group-hover:bg-primary/10 flex items-center justify-center mb-3 transition-colors">
                  <Upload className="w-5 h-5 text-primary" />
                </div>
                <h4 className="text-sm font-medium font-display text-ink">
                  Import Your Own Audio
                </h4>
                <p className="text-xs text-ink-3 mt-1 max-w-[220px]">
                  Drop any MP3, WAV, or M4A file here. Files stay on your device.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmProject !== null}
        onClose={() => setDeleteConfirmProject(null)}
        onConfirm={() => {
          if (deleteConfirmProject) {
            handleDeleteProject(deleteConfirmProject);
            setDeleteConfirmProject(null);
          }
        }}
        title="Remove Project?"
        description={`Are you sure you want to remove "${deleteConfirmProject?.title}"? You can undo this action immediately.`}
        confirmLabel="Remove"
        isDestructive={true}
      />
    </div>
  );
};
