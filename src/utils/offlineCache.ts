const CACHE_NAME = 'melodymentor-audio-cache';

export const cacheTrackAudio = async (trackId: string, audioUrl: string) => {
  if (!audioUrl) return;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = `/api/offline/audio/${trackId}`;
    
    // Check if already cached
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) return true;

    // Fetch and store
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    
    await cache.put(cacheKey, response);
    return true;
  } catch (error) {
    console.error('Error caching track:', error);
    return false;
  }
};

export const isTrackCached = async (trackId: string): Promise<boolean> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = `/api/offline/audio/${trackId}`;
    const cachedResponse = await cache.match(cacheKey);
    return !!cachedResponse;
  } catch {
    return false;
  }
};

export const getCachedAudioUrl = async (trackId: string): Promise<string | null> => {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cacheKey = `/api/offline/audio/${trackId}`;
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch {
    return null;
  }
};
