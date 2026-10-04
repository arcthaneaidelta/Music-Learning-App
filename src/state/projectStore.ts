import { create } from 'zustand';
import { ProjectData, Region, Marker, SessionState, DEFAULT_HARBOUR_LIGHT_PROJECT, REGION_COLORS, MARKER_COLORS } from '../persistence/schema';
import { getProject, saveProject, getAudioBlob } from '../persistence/db';
import { AudioEngine } from '../audio/AudioEngine';
import { generateSampleTrack } from '../audio/sampleTrack';
import { generateId } from '../lib/ids';

interface ProjectState {
  project: ProjectData;
  isPlaying: boolean;
  rate: number;
  loop: { a: number; b: number } | null;
  loopPass: number;
  snap: 'bar' | 'beat' | 'off';
  zoom: number;
  metronome: boolean;
  countIn: boolean;
  hearScrub: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  lastSavedAt: string | null;
  isAudioReady: boolean;
  activeSheet: 'markers' | 'beat' | 'map' | 'sync' | 'shortcuts' | null;
  currentSection: Region | null;
  recentRestored: boolean;

  // Actions
  loadProject: (id: string) => Promise<boolean>;
  updateTitle: (title: string) => void;
  setBpm: (bpm: number) => void;
  setDownbeatOffset: (offset: number) => void;
  nudgeDownbeatMs: (deltaMs: number) => void;
  setRate: (rate: number) => void;
  setLoop: (loop: { a: number; b: number } | null) => void;
  clearLoop: () => void;
  setSnap: (snap: 'bar' | 'beat' | 'off') => void;
  setZoom: (zoom: number) => void;
  togglePlay: () => Promise<void>;
  seekTo: (time: number) => void;
  stepBar: (direction: 1 | -1) => void;
  stepBeat: (direction: 1 | -1) => void;

  // Markers
  addMarker: (time?: number, name?: string) => Marker;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  deleteMarker: (id: string) => void;

  // Regions
  addRegion: (region: Omit<Region, 'id'>) => Region;
  updateRegion: (id: string, updates: Partial<Region>) => void;
  deleteRegion: (id: string) => void;
  jumpToRegion: (id: string) => void;
  loopRegion: (id: string) => void;

  // Toggles
  toggleMetronome: () => void;
  toggleCountIn: () => void;
  toggleHearScrub: () => void;
  setActiveSheet: (sheet: 'markers' | 'beat' | 'map' | 'sync' | 'shortcuts' | null) => void;

  // Persistence & Simulation
  saveCurrentProject: () => Promise<void>;
  simulateAppKill: () => Promise<void>;
}

let saveDebounceTimer: number | null = null;

export const useProjectStore = create<ProjectState>((set, get) => {
  const engine = AudioEngine.getInstance();

  // Listen to engine state events
  engine.subscribe((event, data) => {
    if (event === 'play') set({ isPlaying: true });
    if (event === 'pause') set({ isPlaying: false });
    if (event === 'ratechange') set({ rate: data });
    if (event === 'loopchange') set({ loop: data });
    if (event === 'metronomechange') set({ metronome: data });
  });

  const debouncedAutoSave = () => {
    set({ saveStatus: 'saving' });
    if (saveDebounceTimer !== null) {
      clearTimeout(saveDebounceTimer);
    }
    saveDebounceTimer = window.setTimeout(async () => {
      await get().saveCurrentProject();
    }, 400);
  };

  return {
    project: DEFAULT_HARBOUR_LIGHT_PROJECT,
    isPlaying: false,
    rate: 1.0,
    loop: null,
    loopPass: 0,
    snap: 'bar',
    zoom: 1.0,
    metronome: false,
    countIn: false,
    hearScrub: true,
    saveStatus: 'saved',
    lastSavedAt: null,
    isAudioReady: false,
    activeSheet: null,
    currentSection: DEFAULT_HARBOUR_LIGHT_PROJECT.regions[0] || null,
    recentRestored: false,

    loadProject: async (id: string): Promise<boolean> => {
      set({ isAudioReady: false });
      let loaded = await getProject(id);
      if (!loaded && id === 'harbour-light') {
        loaded = DEFAULT_HARBOUR_LIGHT_PROJECT;
        await saveProject(loaded);
      }

      if (!loaded) return false;

      // Sync engine configurations
      engine.beatMap.setBpm(loaded.tempoMap[0]?.bpm || 96);
      engine.beatMap.setDownbeat(loaded.downbeatOffset);
      engine.clock.setDuration(loaded.audio.duration);
      engine.setRate(loaded.session.rate);
      engine.setLoop(loaded.session.loop);

      // Check if project was recently killed / restored via simulateAppKill flag
      const wasSimulatedKill = sessionStorage.getItem(`metre_restore_${id}`);
      if (wasSimulatedKill) {
        sessionStorage.removeItem(`metre_restore_${id}`);
        set({ recentRestored: true });
        setTimeout(() => set({ recentRestored: false }), 4500);
      }

      // Restore position
      if (loaded.session.position > 0) {
        engine.seek(loaded.session.position);
      }

      set({
        project: loaded,
        rate: loaded.session.rate,
        loop: loaded.session.loop,
        snap: loaded.session.snap,
        zoom: loaded.session.zoom,
        metronome: loaded.session.metronome,
        countIn: loaded.session.countIn || false,
        hearScrub: loaded.session.hearScrub !== undefined ? loaded.session.hearScrub : true,
        currentSection: loaded.regions[0] || null,
        saveStatus: 'saved',
      });

      // Load audio data: either synthesize sample track or decode uploaded blob
      try {
        if (!loaded.audio.isCustomUpload && loaded.id === 'harbour-light') {
          const buffer = await generateSampleTrack();
          await engine.setAudioBuffer(buffer, false);
          set({ isAudioReady: true });
        } else {
          // Uploaded file from blob store
          const blob = await getAudioBlob(loaded.id);
          if (blob) {
            const ctx = await engine.ensureContext();
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
            await engine.setAudioBuffer(audioBuffer, false);
            set({ isAudioReady: true });
          } else {
            console.warn('Audio blob not found in storage for custom upload.');
            set({ isAudioReady: false });
          }
        }
      } catch (err) {
        console.error('Audio loading error:', err);
        set({ isAudioReady: false });
      }

      return true;
    },

    updateTitle: (title: string) => {
      set((state) => ({
        project: { ...state.project, title },
      }));
      debouncedAutoSave();
    },

    setBpm: (bpm: number) => {
      engine.beatMap.setBpm(bpm);
      set((state) => ({
        project: {
          ...state.project,
          tempoMap: [{ time: 0, bpm, meter: [4, 4] }],
        },
      }));
      debouncedAutoSave();
    },

    setDownbeatOffset: (offset: number) => {
      engine.beatMap.setDownbeat(offset);
      set((state) => ({
        project: {
          ...state.project,
          downbeatOffset: offset,
        },
      }));
      debouncedAutoSave();
    },

    nudgeDownbeatMs: (deltaMs: number) => {
      engine.beatMap.nudgeDownbeatMs(deltaMs);
      const newOffset = engine.beatMap.downbeatOffset;
      set((state) => ({
        project: {
          ...state.project,
          downbeatOffset: newOffset,
        },
      }));
      debouncedAutoSave();
    },

    setRate: (rate: number) => {
      engine.setRate(rate);
      set((state) => ({
        rate,
        project: {
          ...state.project,
          session: { ...state.project.session, rate },
        },
      }));
      debouncedAutoSave();
    },

    setLoop: (loop: { a: number; b: number } | null) => {
      engine.setLoop(loop);
      set((state) => ({
        loop,
        project: {
          ...state.project,
          session: { ...state.project.session, loop },
        },
      }));
      debouncedAutoSave();
    },

    clearLoop: () => {
      engine.setLoop(null);
      set((state) => ({
        loop: null,
        project: {
          ...state.project,
          session: { ...state.project.session, loop: null },
        },
      }));
      debouncedAutoSave();
    },

    setSnap: (snap: 'bar' | 'beat' | 'off') => {
      set((state) => ({
        snap,
        project: {
          ...state.project,
          session: { ...state.project.session, snap },
        },
      }));
      debouncedAutoSave();
    },

    setZoom: (zoom: number) => {
      const clamped = Math.max(0.5, Math.min(8.0, zoom));
      set((state) => ({
        zoom: clamped,
        project: {
          ...state.project,
          session: { ...state.project.session, zoom: clamped },
        },
      }));
    },

    togglePlay: async () => {
      if (get().isPlaying) {
        engine.pause();
      } else {
        await engine.play(get().countIn);
      }
    },

    seekTo: (time: number) => {
      engine.seek(time);
      set((state) => ({
        project: {
          ...state.project,
          session: { ...state.project.session, position: time },
        },
      }));
      debouncedAutoSave();
    },

    stepBar: (direction: 1 | -1) => {
      const curPos = engine.getSongPosition();
      const curBeat = engine.beatMap.timeToBeat(curPos);
      const targetBar = Math.max(1, curBeat.bar + direction);
      const targetTime = engine.beatMap.beatToTime(targetBar, 1);
      get().seekTo(targetTime);
    },

    stepBeat: (direction: 1 | -1) => {
      const curPos = engine.getSongPosition();
      const spb = engine.beatMap.secondsPerBeat;
      const targetTime = Math.max(0, curPos + direction * spb);
      get().seekTo(targetTime);
    },

    addMarker: (time?: number, name?: string): Marker => {
      const pos = time !== undefined ? time : engine.getSongPosition();
      const snapMode = get().snap;
      const snapResult = engine.beatMap.snapTime(pos, snapMode);
      const finalTime = snapResult.time;

      const markerCount = get().project.markers.length;
      const newMarker: Marker = {
        id: generateId('m'),
        name: name || `Marker ${markerCount + 1}`,
        time: finalTime,
        color: MARKER_COLORS[markerCount % MARKER_COLORS.length],
      };

      set((state) => ({
        project: {
          ...state.project,
          markers: [...state.project.markers, newMarker].sort((a, b) => a.time - b.time),
        },
      }));
      debouncedAutoSave();
      return newMarker;
    },

    updateMarker: (id: string, updates: Partial<Marker>) => {
      set((state) => ({
        project: {
          ...state.project,
          markers: state.project.markers
            .map((m) => (m.id === id ? { ...m, ...updates } : m))
            .sort((a, b) => a.time - b.time),
        },
      }));
      debouncedAutoSave();
    },

    deleteMarker: (id: string) => {
      set((state) => ({
        project: {
          ...state.project,
          markers: state.project.markers.filter((m) => m.id !== id),
        },
      }));
      debouncedAutoSave();
    },

    addRegion: (region: Omit<Region, 'id'>): Region => {
      const regionCount = get().project.regions.length;
      const newRegion: Region = {
        id: generateId('r'),
        name: region.name || `Section ${regionCount + 1}`,
        start: region.start,
        end: region.end,
        color: region.color || REGION_COLORS[regionCount % REGION_COLORS.length],
      };

      set((state) => ({
        project: {
          ...state.project,
          regions: [...state.project.regions, newRegion].sort((a, b) => a.start - b.start),
        },
      }));
      debouncedAutoSave();
      return newRegion;
    },

    updateRegion: (id: string, updates: Partial<Region>) => {
      set((state) => ({
        project: {
          ...state.project,
          regions: state.project.regions
            .map((r) => (r.id === id ? { ...r, ...updates } : r))
            .sort((a, b) => a.start - b.start),
        },
      }));
      debouncedAutoSave();
    },

    deleteRegion: (id: string) => {
      set((state) => ({
        project: {
          ...state.project,
          regions: state.project.regions.filter((r) => r.id !== id),
        },
      }));
      debouncedAutoSave();
    },

    jumpToRegion: (id: string) => {
      const region = get().project.regions.find((r) => r.id === id);
      if (region) {
        get().seekTo(region.start);
      }
    },

    loopRegion: (id: string) => {
      const region = get().project.regions.find((r) => r.id === id);
      if (region) {
        get().setLoop({ a: region.start, b: region.end });
        get().seekTo(region.start);
      }
    },

    toggleMetronome: () => {
      const next = !get().metronome;
      engine.setMetronome(next);
      set((state) => ({
        metronome: next,
        project: {
          ...state.project,
          session: { ...state.project.session, metronome: next },
        },
      }));
      debouncedAutoSave();
    },

    toggleCountIn: () => {
      const next = !get().countIn;
      set((state) => ({
        countIn: next,
        project: {
          ...state.project,
          session: { ...state.project.session, countIn: next },
        },
      }));
      debouncedAutoSave();
    },

    toggleHearScrub: () => {
      const next = !get().hearScrub;
      set((state) => ({
        hearScrub: next,
        project: {
          ...state.project,
          session: { ...state.project.session, hearScrub: next },
        },
      }));
      debouncedAutoSave();
    },

    setActiveSheet: (sheet) => {
      set({ activeSheet: sheet });
    },

    saveCurrentProject: async () => {
      const curPos = engine.getSongPosition();
      const current = get().project;
      const sessionToSave: SessionState = {
        position: curPos,
        rate: get().rate,
        loop: get().loop,
        snap: get().snap,
        zoom: get().zoom,
        metronome: get().metronome,
        countIn: get().countIn,
        hearScrub: get().hearScrub,
      };

      const updatedProject: ProjectData = {
        ...current,
        session: sessionToSave,
        updatedAt: new Date().toISOString(),
      };

      try {
        await saveProject(updatedProject);
        set({
          project: updatedProject,
          saveStatus: 'saved',
          lastSavedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to save project:', err);
        set({ saveStatus: 'error' });
      }
    },

    simulateAppKill: async () => {
      const curPos = engine.getSongPosition();
      const current = get().project;
      const sessionToSave: SessionState = {
        position: curPos,
        rate: get().rate,
        loop: get().loop,
        snap: get().snap,
        zoom: get().zoom,
        metronome: get().metronome,
        countIn: get().countIn,
        hearScrub: get().hearScrub,
      };

      const updatedProject: ProjectData = {
        ...current,
        session: sessionToSave,
        updatedAt: new Date().toISOString(),
      };

      // Flush to IndexedDB immediately
      await saveProject(updatedProject);
      // Mark restoration flag for toast message
      sessionStorage.setItem(`metre_restore_${current.id}`, 'true');

      // Immediate browser reload
      window.location.reload();
    },
  };
});
