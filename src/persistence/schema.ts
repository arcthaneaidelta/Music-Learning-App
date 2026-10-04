export interface ProjectAudioMeta {
  name: string;
  duration: number;
  sampleRate: number;
  fingerprint: string;
  isCustomUpload?: boolean;
}

export interface Region {
  id: string;
  name: string;
  start: number;
  end: number;
  color: string;
}

export interface Marker {
  id: string;
  name: string;
  time: number;
  color: string;
}

export interface SessionState {
  position: number;
  rate: number;
  loop: { a: number; b: number } | null;
  snap: 'bar' | 'beat' | 'off';
  zoom: number;
  metronome: boolean;
  countIn?: boolean;
  hearScrub?: boolean;
}

export interface ProjectData {
  schemaVersion: number;
  id: string;
  title: string;
  audio: ProjectAudioMeta;
  tempoMap: { time: number; bpm: number; meter: [number, number] }[];
  downbeatOffset: number;
  regions: Region[];
  markers: Marker[];
  session: SessionState;
  updatedAt: string;
}

export const REGION_COLORS = [
  '#C9B79C', // Sand
  '#A9BBA7', // Sage
  '#D3A99A', // Clay
  '#A8B5C4', // Slate
  '#CDBF8F', // Straw
  '#B8A9BF', // Heather
];

export const MARKER_COLORS = [
  '#C2542F', // Terracotta
  '#3E6A8A', // Slate Blue
  '#3F7A57', // Forest
  '#B7862B', // Amber
  '#8A9A8E', // Sage
  '#7C847F', // Ink-3
];

export const DEFAULT_HARBOUR_LIGHT_PROJECT: ProjectData = {
  schemaVersion: 1,
  id: 'harbour-light',
  title: 'Harbour Light',
  audio: {
    name: 'harbour-light.generated',
    duration: 80.0,
    sampleRate: 44100,
    fingerprint: 'len:3528000|rms:0.1832',
  },
  tempoMap: [{ time: 0, bpm: 96, meter: [4, 4] }],
  downbeatOffset: 0.0,
  regions: [
    { id: 'r1', name: 'Intro', start: 0.0, end: 10.0, color: '#C9B79C' },
    { id: 'r2', name: 'Verse', start: 10.0, end: 30.0, color: '#A9BBA7' },
    { id: 'r3', name: 'Chorus', start: 30.0, end: 50.0, color: '#D3A99A' },
    { id: 'r4', name: 'Bridge', start: 50.0, end: 60.0, color: '#A8B5C4' },
    { id: 'r5', name: 'Outro', start: 60.0, end: 80.0, color: '#CDBF8F' },
  ],
  markers: [
    { id: 'm1', name: 'Fill in', time: 29.375, color: '#C2542F' },
    { id: 'm2', name: 'Watch the stop', time: 49.375, color: '#3E6A8A' },
  ],
  session: {
    position: 0.0,
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

/**
 * Validates and migrates raw JSON into a ProjectData object.
 */
export function migrateProject(data: any): ProjectData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid project JSON structure.');
  }

  const version = data.schemaVersion || 1;
  const migrated: ProjectData = {
    schemaVersion: 1,
    id: data.id || 'project-' + Date.now(),
    title: data.title || 'Untitled Project',
    audio: {
      name: data.audio?.name || 'audio',
      duration: Number(data.audio?.duration) || 80.0,
      sampleRate: Number(data.audio?.sampleRate) || 44100,
      fingerprint: data.audio?.fingerprint || 'unknown',
      isCustomUpload: Boolean(data.audio?.isCustomUpload),
    },
    tempoMap: Array.isArray(data.tempoMap) && data.tempoMap.length > 0
      ? data.tempoMap.map((t: any) => ({
          time: Number(t.time) || 0,
          bpm: Number(t.bpm) || 96,
          meter: Array.isArray(t.meter) && t.meter.length === 2 ? [t.meter[0], t.meter[1]] : [4, 4],
        }))
      : [{ time: 0, bpm: 96, meter: [4, 4] }],
    downbeatOffset: Number(data.downbeatOffset) || 0.0,
    regions: Array.isArray(data.regions)
      ? data.regions.map((r: any, idx: number) => ({
          id: r.id || `r${idx + 1}`,
          name: r.name || `Section ${idx + 1}`,
          start: Math.max(0, Number(r.start) || 0),
          end: Math.max(0, Number(r.end) || 10),
          color: r.color || REGION_COLORS[idx % REGION_COLORS.length],
        }))
      : [],
    markers: Array.isArray(data.markers)
      ? data.markers.map((m: any, idx: number) => ({
          id: m.id || `m${idx + 1}`,
          name: m.name || `Marker ${idx + 1}`,
          time: Math.max(0, Number(m.time) || 0),
          color: m.color || MARKER_COLORS[idx % MARKER_COLORS.length],
        }))
      : [],
    session: {
      position: Math.max(0, Number(data.session?.position) || 0),
      rate: Math.max(0.5, Math.min(1.5, Number(data.session?.rate) || 1.0)),
      loop: data.session?.loop && data.session.loop.b > data.session.loop.a
        ? { a: Number(data.session.loop.a), b: Number(data.session.loop.b) }
        : null,
      snap: ['bar', 'beat', 'off'].includes(data.session?.snap) ? data.session.snap : 'bar',
      zoom: Number(data.session?.zoom) || 1.0,
      metronome: Boolean(data.session?.metronome),
      countIn: Boolean(data.session?.countIn),
      hearScrub: data.session?.hearScrub !== undefined ? Boolean(data.session.hearScrub) : true,
    },
    updatedAt: data.updatedAt || new Date().toISOString(),
  };

  return migrated;
}
