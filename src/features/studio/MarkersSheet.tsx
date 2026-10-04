import React, { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { useProjectStore } from '../../state/projectStore';
import { formatTime, formatBarBeat } from '../../lib/format';
import { AudioEngine } from '../../audio/AudioEngine';
import { Flag, Trash2, Plus, Edit2, Check } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { MARKER_COLORS } from '../../persistence/schema';

export const MarkersSheet: React.FC = () => {
  const {
    activeSheet,
    setActiveSheet,
    project,
    seekTo,
    addMarker,
    updateMarker,
    deleteMarker,
  } = useProjectStore();

  const { showToast } = useToast();
  const engine = AudioEngine.getInstance();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const isOpen = activeSheet === 'markers';
  const onClose = () => setActiveSheet(null);

  const handleStartRename = (id: string, currentName: string) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      updateMarker(id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, name: string, time: number, color: string) => {
    deleteMarker(id);
    showToast({
      type: 'undo',
      text: `Deleted marker "${name}"`,
      undoAction: () => {
        useProjectStore.getState().addMarker(time, name);
      },
    });
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Timestamped Markers"
      subtitle={`${project.markers.length} markers on timeline`}
    >
      <div className="flex flex-col gap-4">
        {/* Add Marker Button */}
        <button
          type="button"
          onClick={() => {
            const m = addMarker();
            showToast({
              type: 'success',
              text: `Added ${m.name} at current position`,
            });
          }}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary text-white rounded-md text-xs font-medium font-ui hover:bg-primary-hover active:scale-98 transition-all shadow-1"
        >
          <Plus className="w-4 h-4" />
          <span>Add Marker at Current Position</span>
        </button>

        {/* Markers List */}
        <div className="flex flex-col divide-y divide-border border border-border rounded-md bg-surface overflow-hidden">
          {project.markers.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-3">
              No markers yet. Tap "+ Marker" or press <kbd className="px-1 py-0.5 border rounded bg-surface-sunken">M</kbd> while playing to drop flags on the beat.
            </div>
          ) : (
            project.markers.map((marker) => {
              const beatPos = engine.beatMap.timeToBeat(marker.time);
              const isEditing = editingId === marker.id;

              return (
                <div
                  key={marker.id}
                  className="flex items-center justify-between p-3 hover:bg-surface-sunken/60 transition-colors gap-2"
                >
                  <div
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    onClick={() => {
                      seekTo(marker.time);
                      showToast({ type: 'info', text: `Jumped to ${marker.name}` });
                    }}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: marker.color }}
                    />

                    {isEditing ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(marker.id)}
                          autoFocus
                          className="px-2 py-1 text-xs border border-border-strong rounded bg-white text-ink w-full"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(marker.id)}
                          className="p-1 hover:text-success"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-ink truncate">
                          {marker.name}
                        </span>
                        <span className="text-[11px] font-mono text-ink-3">
                          {formatTime(marker.time, true)} · {formatBarBeat(beatPos.bar, beatPos.beat)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartRename(marker.id, marker.name)}
                      className="p-1 text-ink-3 hover:text-ink rounded"
                      title="Rename"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(marker.id, marker.name, marker.time, marker.color)}
                      className="p-1 text-ink-3 hover:text-error rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Sheet>
  );
};
