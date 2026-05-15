import requests
import os

# Standalone Gaana Extraction Logic
def format_duration(seconds):
    if not seconds: return "0:00"
    try:
        m, s = divmod(int(seconds), 60)
        return f"{m}:{s:02d}"
    except:
        return "0:00"

def map_gaana_to_song(track):
    # Standardize Gaana metadata to our frontend Song schema
    images = track.get('images', {}).get('urls', {})
    streams = track.get('stream_urls', {}).get('urls', {})
    
    # Proactively check for images and streams
    cover = images.get('large_artwork') or images.get('medium_artwork') or images.get('small_artwork') or ""
    preview = streams.get('very_high_quality') or streams.get('high_quality') or streams.get('medium_quality') or ""
    
    return {
        "id": f"gaana_{track.get('track_id')}",
        "seokey": track.get('seokey'), # Critical for stream re-fetching
        "title": track.get('title', 'Unknown Title'),
        "artist": track.get('artists', 'Unknown Artist'),
        "album": track.get('album', 'Unknown Album'),
        "duration": format_duration(track.get('duration')),
        "coverUrl": cover,
        "preview": preview,
        "isFavorite": False,
        "source": "gaana"
    }

def search_for_song(query, limit=10):
    gaana_api_url = os.environ.get('GAANA_API_URL', 'http://127.0.0.1:8000')
    try:
        res = requests.get(f"{gaana_api_url}/songs/search?query={query}&limit={limit}", timeout=5)
        if res.status_code == 200:
            results = res.json()
            return [map_gaana_to_song(t) for t in results]
    except Exception as e:
        print(f"Gaana search error: {e}")
    return []

def get_song_info(seokey):
    gaana_api_url = os.environ.get('GAANA_API_URL', 'http://127.0.0.1:8000')
    try:
        res = requests.get(f"{gaana_api_url}/songs/info?seokey={seokey}", timeout=5)
        if res.status_code == 200:
            track = res.json()
            return map_gaana_to_song(track)
    except Exception as e:
        print(f"Gaana info error: {e}")
    return None
