import { createStore, get, set, del, entries } from 'idb-keyval';
import { ProjectData, DEFAULT_HARBOUR_LIGHT_PROJECT, migrateProject } from './schema';

const projectStore = createStore('metre-db', 'projects');
const blobStore = createStore('metre-db', 'blobs');

export async function initDatabase(): Promise<void> {
  try {
    const existing = await get('harbour-light', projectStore);
    if (!existing) {
      await set('harbour-light', DEFAULT_HARBOUR_LIGHT_PROJECT, projectStore);
    }
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

export async function saveProject(project: ProjectData): Promise<void> {
  const updated = {
    ...project,
    updatedAt: new Date().toISOString(),
  };
  await set(project.id, updated, projectStore);
}

export async function getProject(id: string): Promise<ProjectData | null> {
  try {
    const raw = await get(id, projectStore);
    if (!raw) {
      if (id === 'harbour-light') {
        return DEFAULT_HARBOUR_LIGHT_PROJECT;
      }
      return null;
    }
    return migrateProject(raw);
  } catch (err) {
    console.error(`Error loading project ${id}:`, err);
    return null;
  }
}

export async function listProjects(): Promise<ProjectData[]> {
  try {
    const all = await entries(projectStore);
    const projects: ProjectData[] = [];

    for (const [key, val] of all) {
      try {
        projects.push(migrateProject(val));
      } catch (err) {
        console.warn(`Skipping invalid project key ${key}:`, err);
      }
    }

    if (projects.length === 0) {
      projects.push(DEFAULT_HARBOUR_LIGHT_PROJECT);
    }

    // Sort by updatedAt descending
    projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return projects;
  } catch (err) {
    console.error('Error listing projects:', err);
    return [DEFAULT_HARBOUR_LIGHT_PROJECT];
  }
}

export async function deleteProject(id: string): Promise<void> {
  await del(id, projectStore);
  await del(id, blobStore);
}

export async function saveAudioBlob(id: string, blob: Blob): Promise<void> {
  await set(id, blob, blobStore);
}

export async function getAudioBlob(id: string): Promise<Blob | null> {
  try {
    const blob = await get(id, blobStore);
    return blob || null;
  } catch {
    return null;
  }
}
