from flask import Flask, request, jsonify
import os
import sys
# Add the current directory to sys.path to allow importing local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import jiosaavn
import math
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

GAANA_API_URL = os.environ.get('GAANA_API_URL', 'http://127.0.0.1:8000')

def map_gaana_to_song(track):
    images = track.get('images', {}).get('urls', {})
    image = images.get('large_artwork') or images.get('medium_artwork') or "https://via.placeholder.com/500"
    
    streams = track.get('stream_urls', {}).get('urls', {})
    # Prefer very high quality, then high, then medium
    media_url = streams.get('very_high_quality') or streams.get('high_quality') or streams.get('medium_quality') or ""
    
    return {
        "id": f"gaana_{track.get('track_id', 'unknown')}",
        "title": track.get('title', 'Unknown'),
        "artist": track.get('artists', 'Unknown Artist'),
        "album": track.get('album', 'Unknown Album'),
        "duration": format_duration(track.get('duration')),
        "coverUrl": image,
        "preview": media_url,
        "isFavorite": False,
        "source": "gaana"
    }

def map_jiosaavn_to_song(track):
    image = track.get('image') or track.get('image_url') or ""
    if image and not image.startswith('http'):
        image = f"https://c.saavncdn.com/{image.lstrip('/')}"
    if not image:
        image = "https://via.placeholder.com/500"
        
    if isinstance(image, str):
        image = image.replace('150x150', '500x500').replace('50x50', '500x500')
    
    media_url = track.get('media_url') or track.get('url') or track.get('preview_url') or ""
    if media_url and not media_url.startswith('http'):
        media_url = f"https://aac.saavncdn.com/{media_url.lstrip('/')}"
    
    # Route through proxy if it's a saavncdn link to bypass CORS/Mixed Content
    if media_url and 'saavncdn.com' in media_url:
        # Ensure we don't double-proxy if it's already a proxy URL
        if not media_url.startswith('/api/audio-proxy'):
            media_url = f"/api/audio-proxy?url={media_url}"

    return {
        "id": str(track.get('id', 'unknown')),
        "title": track.get('song') or track.get('title') or 'Unknown',
        "artist": track.get('singers') or track.get('primary_artists') or 'Unknown Artist',
        "album": track.get('album') or 'Unknown Album',
        "duration": format_duration(track.get('duration')),
        "coverUrl": image,
        "preview": media_url,
        "isFavorite": False,
        "source": "jiosaavn"
    }

@app.route('/api/songs')
def get_songs():
    query = request.args.get('search')
    if query and query.strip():
        jio_songs = []
        gaana_songs = []
        yt_songs = []

        try:
            # JioSaavn Search
            jio_results = jiosaavn.search_for_song(query, False, True)
            if isinstance(jio_results, list):
                jio_songs = [map_jiosaavn_to_song(t) for t in jio_results[:15]]
        except Exception as e:
            print(f"JioSaavn error: {e}")

        try:
            # GaanaPy Search
            import requests
            res = requests.get(f"{GAANA_API_URL}/songs/search?query={query}&limit=10", timeout=5)
            if res.status_code == 200:
                gaana_results = res.json()
                if isinstance(gaana_results, list):
                    gaana_songs = [map_gaana_to_song(t) for t in gaana_results]
        except Exception as e:
            print(f"GaanaPy error: {e}")

        try:
            # YouTube Search
            import requests
            res = requests.get(f"{YOUTUBE_API_URL}/search?query={query}&limit=10", timeout=8)
            if res.status_code == 200:
                yt_results = res.json()
                if isinstance(yt_results, list):
                    yt_songs = [map_youtube_to_song(t) for t in yt_results]
        except Exception as e:
            print(f"YouTube error: {e}")

        # Interleave results for maximum discovery
        all_songs = []
        max_len = max(len(jio_songs), len(gaana_songs), len(yt_songs))
        for i in range(max_len):
            if i < len(jio_songs): all_songs.append(jio_songs[i])
            if i < len(gaana_songs): all_songs.append(gaana_songs[i])
            if i < len(yt_songs): all_songs.append(yt_songs[i])
            
        return jsonify({"songs": all_songs[:40]})
    else:
        # Default popular songs (matching server.ts)
        popular = [
            { "id": 'popular_husn', "title": 'Husn', "artist": 'Anuv Jain', "album": 'Husn', "duration": '3:19', "coverUrl": 'https://i.scdn.co/image/ab67616d0000b2734c5c432d73af64860d7d5d2e', "preview": 'https://cdns-preview-4.dzcdn.net/stream/c-4e4b1b1c2f0b7a4b5e8c7b8d9e5f5a6-3.mp3', "isFavorite": False, "source": 'popular' },
            { "id": 'popular_seven', "title": 'Seven', "artist": 'Jungkook ft. Latto', "album": 'Seven', "duration": '3:04', "coverUrl": 'https://i.scdn.co/image/ab67616d0000b2738c5c432d73af64860d7d5e3f', "preview": 'https://cdns-preview-5.dzcdn.net/stream/c-5f5c2c2d3g1c8b5c9d8c8e9f0a6b7c7-4.mp3', "isFavorite": False, "source": 'popular' }
        ]
        return jsonify({"songs": popular})

@app.route('/api/stream')
def get_stream():
    video_id = request.args.get('id')
    return jsonify({"url": video_id})

@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "server": "serverless-python"})

@app.route('/api/audio-proxy')
def audio_proxy():
    url = request.args.get('url')
    if not url:
        return "No URL provided", 400
    
    try:
        import requests
        headers = {'User-Agent': 'Mozilla/5.0'}
        # Pass the Range header from the client to the upstream server
        if 'Range' in request.headers:
            headers['Range'] = request.headers['Range']
            
        r = requests.get(url, stream=True, headers=headers)
        
        # Build the response with the same status and relevant headers
        res = app.response_class(
            r.iter_content(chunk_size=1024*64),
            status=r.status_code,
            content_type=r.headers.get('content-type', 'audio/mpeg')
        )
        
        # Relay important headers for seeking
        for h in ['Content-Range', 'Content-Length', 'Accept-Ranges']:
            if h in r.headers:
                res.headers[h] = r.headers[h]
        
        res.headers['Access-Control-Allow-Origin'] = '*'
        return res
    except Exception as e:
        return str(e), 500

@app.route('/api/modules')
def get_modules():
    languages = request.args.get('language', 'english,hindi')
    data = None
    try:
        data = jiosaavn.get_home_data(languages)
    except:
        pass
    
    trending = []
    if data:
        # Try different keys for trending songs
        trending_data = data.get('new_trending') or data.get('trending') or data.get('new_albums') or data.get('top_playlists') or []
        for item in trending_data:
            if not isinstance(item, dict):
                continue
            # If it's a song, map it
            if item.get('type') == 'song' or 'song' in item:
                trending.append(map_jiosaavn_to_song(item))
            # If it's an album/playlist, we might need to fetch its songs, 
            # but for now let's just use the first few items if they are songs.
            elif item.get('type') in ['album', 'playlist']:
                # For now, we skip non-song types in the trending grid to avoid broken playback
                continue
    
    # Fallback 1: Search for trending
    if not trending:
        try:
            fallback_results = jiosaavn.search_for_song('trending', False, True)
            if isinstance(fallback_results, list) and len(fallback_results) > 0:
                trending = [map_jiosaavn_to_song(t) for t in fallback_results[:15]]
        except:
            pass

    # Fallback 2: Hardcoded Evergreen Hits (Always works)
    if not trending:
        evergreen = [
            { "id": 'jio_1', "song": 'Husn', "singers": 'Anuv Jain', "album": 'Husn', "duration": '219', "image": 'https://c.saavncdn.com/712/Husn-Hindi-2023-20231201053005-500x500.jpg', "media_url": 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
            { "id": 'jio_2', "song": 'Perfect', "singers": 'Ed Sheeran', "album": 'Divide', "duration": '263', "image": 'https://c.saavncdn.com/174/Divide-English-2017-500x500.jpg', "media_url": 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
            { "id": 'jio_3', "song": 'Blinding Lights', "singers": 'The Weeknd', "album": 'After Hours', "duration": '200', "image": 'https://c.saavncdn.com/743/After-Hours-English-2020-20200320000000-500x500.jpg', "media_url": 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' }
        ]
        trending = [map_jiosaavn_to_song(t) for t in evergreen]

    charts = []
    if data and 'charts' in data:
        for chart in data['charts']:
            if isinstance(chart, dict):
                charts.append({
                    "id": chart.get('id'),
                    "title": chart.get('title'),
                    "image": chart.get('image'),
                    "subtitle": chart.get('subtitle'),
                    "type": chart.get('type'),
                    "perma_url": chart.get('perma_url')
                })
            
    return jsonify({
        "trending": trending,
        "charts": charts
    })

@app.route('/api/playlist')
def get_playlist_songs():
    list_id = request.args.get('id')
    if not list_id:
        return jsonify({"songs": []})
    data = jiosaavn.get_playlist(list_id, False)
    if data and 'songs' in data:
        songs = [map_jiosaavn_to_song(t) for t in data['songs']]
        return jsonify({"songs": songs, "name": data.get('listname')})
    return jsonify({"songs": []})

# For local development
if __name__ == '__main__':
    app.run(port=3005)
