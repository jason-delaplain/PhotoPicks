import * as MediaLibrary from 'expo-media-library';

export interface CachedPhoto {
  id: string;
  uri: string;
  filename?: string | null;
  mediaType?: string;
  width: number;
  height: number;
  creationTime: number;
  modificationTime: number;
}

type Progress = { done: number; total: number };

/**
 * Simple in-memory cache for device photos and resolved URIs.
 * - getOrScan returns cached photos if available; otherwise scans and caches.
 * - refresh forces a rescan and updates the cache.
 * - removeByIds removes items from cache when deleted.
 *
 * Not persisted across app restarts; this is per-process cache.
 */
class MediaCacheClass {
  private photos: CachedPhoto[] | null = null;
  private resolvedUris: Record<string, string> = {};
  private scanning = false;

  getCached() {
    return { photos: this.photos, resolvedUris: this.resolvedUris } as const;
  }

  async getOrScan(onProgress?: (p: Progress) => void): Promise<{ photos: CachedPhoto[]; resolvedUris: Record<string, string> }> {
    if (this.photos && Object.keys(this.resolvedUris).length === this.photos.length) {
      return { photos: this.photos, resolvedUris: this.resolvedUris };
    }
    if (this.scanning) {
      // naive wait loop if concurrently called
      while (this.scanning) await new Promise(r => setTimeout(r, 50));
      return { photos: this.photos || [], resolvedUris: this.resolvedUris };
    }
    return this.refresh(onProgress);
  }

  async refresh(onProgress?: (p: Progress) => void): Promise<{ photos: CachedPhoto[]; resolvedUris: Record<string, string> }> {
    this.scanning = true;
    try {
      // reset resolved URIs to avoid stale entries
      this.resolvedUris = {};
      const granted = (await MediaLibrary.requestPermissionsAsync(true)).status === 'granted';
      if (!granted) {
        this.photos = [];
        this.resolvedUris = {};
        return { photos: [], resolvedUris: {} };
      }
      let after: string | undefined = undefined;
      const CHUNK = 100;
      let hasNext = true;
      const aggregated: CachedPhoto[] = [];
      let totalCount = 0;
      try {
        const head = await MediaLibrary.getAssetsAsync({ first: 1, mediaType: 'photo', sortBy: 'creationTime' });
        totalCount = (head as any).totalCount ?? 0;
      } catch {}
      let done = 0;
      while (hasNext) {
        const res = await MediaLibrary.getAssetsAsync({ first: CHUNK, mediaType: 'photo', sortBy: 'creationTime', after });
        const assets = res.assets || [];
        hasNext = !!res.hasNextPage;
        after = res.endCursor ?? undefined;
        for (const a of assets) {
          const uri = a.uri; // resolved later if needed by screens
          aggregated.push({
            id: a.id,
            uri,
            filename: a.filename,
            mediaType: a.mediaType as any,
            width: a.width,
            height: a.height,
            creationTime: a.creationTime as any,
            modificationTime: a.modificationTime as any,
          });
          this.resolvedUris[a.id] = uri;
          done += 1;
          onProgress?.({ done, total: totalCount || Math.max(done, 0) });
          // Yield periodically so UI can render progress increments
          if (done % 25 === 0) {
            await new Promise(r => setTimeout(r, 0));
          }
        }
      }
      this.photos = aggregated;
      return { photos: aggregated, resolvedUris: { ...this.resolvedUris } };
    } finally {
      this.scanning = false;
    }
  }

  updateResolvedUri(id: string, uri: string | null) {
    if (!uri) return;
    this.resolvedUris[id] = uri;
  }

  removeByIds(ids: string[]) {
    if (!this.photos) return;
    const set = new Set(ids);
    this.photos = this.photos.filter(p => !set.has(p.id));
    for (const id of ids) delete this.resolvedUris[id];
  }

  clear() {
    this.photos = null;
    this.resolvedUris = {};
  }
}

export const MediaCache = new MediaCacheClass();

export default MediaCache;
