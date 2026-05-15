import requests
import os

GAANA_API_URL = os.environ.get('GAANA_API_URL', 'http://127.0.0.1:8000')

def format_duration(duration_seconds):
    if not duration_seconds:
        return "0:00"
    try:
        total_seconds = int(duration_seconds)
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:02d}"
    except:
        return "0:00"

def map_gaana_to_song(track):
    images = track.get('images', {}).get('urls', {})
    image = images.get('large_artwork') or images.get('medium_artwork') or "https://via.placeholder.com/500"
    
    streams = track.get('stream_urls', {}).get('urls', {})
    # Prefer very high quality, then high, then medium
    media_url = streams.get('very_high_quality') or streams.get('high_quality') or streams.get('medium_quality') or ""
    
    return {
        "id": f"gaana_{track.get('track_id', 'unknown')}",
        "seokey": track.get('seokey'),
        "title": track.get('title', 'Unknown'),
        "artist": track.get('artists', 'Unknown Artist'),
        "album": track.get('album', 'Unknown Album'),
        "duration": format_duration(track.get('duration')),
        "coverUrl": image,
        "preview": media_url,
        "isFavorite": False,
        "source": "gaana"
    }

def search_for_song(query, limit=20):
    try:
        res = requests.get(f"{GAANA_API_URL}/songs/search?query={query}&limit={limit}", timeout=5)
        if res.status_code == 200:
            results = res.json()
            if isinstance(results, list):
                return [map_gaana_to_song(t) for t in results]
    except Exception as e:
        print(f"Gaana search error: {e}")
    return []

def get_song_info(seokey):
    try:
        res = requests.get(f"{GAANA_API_URL}/songs/info?seokey={seokey}", timeout=5)
        if res.status_code == 200:
            data = res.json()
            track = data[0] if isinstance(data, list) else data
            return map_gaana_to_song(track)
    except Exception as e:
        print(f"Gaana info error: {e}")
    return None
