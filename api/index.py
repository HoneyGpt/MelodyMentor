from flask import Flask, request, jsonify, Response
import os
import sys
import requests
from flask_cors import CORS

# Robustly link the separate provider 'branches' (Standalone Modules)
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
print(f"DEBUG: Root Directory detected as: {ROOT_DIR}")

for provider in ['JioSaavnAPI', 'GaanaAPI', 'YouTubeAPI']:
    path = os.path.join(ROOT_DIR, provider)
    if os.path.exists(path):
        sys.path.append(path)
        print(f"DEBUG: Linked {provider} branch at: {path}")
    else:
        print(f"DEBUG: WARNING - {provider} branch NOT FOUND at: {path}")

# Standardize Imports from the new Root Modules
import jiosaavn
import gaana
import youtube

app = Flask(__name__)
CORS(app)

@app.route('/api/search')
@app.route('/api/songs')
def get_songs():
    query = request.args.get('search') or request.args.get('query')
    if query and query.strip():
        songs = []
        
        # 1. JioSaavn Search (Master Branch)
        try:
            # Note: We use the standardized mapping now encapsulated in the module
            jio_results = jiosaavn.search_for_song(query, False, True)
            if isinstance(jio_results, list):
                songs.extend(jio_results[:15])
        except Exception as e:
            print(f"JioSaavn fetch error: {e}")

        # 2. Gaana Search (GaanaAPI Branch)
        try:
            gaana_results = gaana.search_for_song(query, limit=10)
            if gaana_results:
                songs.extend(gaana_results)
        except Exception as e:
            print(f"Gaana fetch error: {e}")

        # 3. YouTube Search (YouTubeAPI Branch)
        try:
            yt_results = youtube.search_for_song(query, limit=8)
            if yt_results:
                # Force preview target to hit our local streaming proxy route
                for track in yt_results:
                    track['preview'] = f"/api/stream?id={track.get('yt_id')}"
                songs.extend(yt_results)
        except Exception as e:
            print(f"YouTube fetch error: {e}")

        return jsonify({"songs": songs})
    else:
        # Default popular songs fallback
        popular = [
            { "id": 'popular_husn', "title": 'Husn', "artist": 'Anuv Jain', "album": 'Husn', "duration": '3:19', "coverUrl": 'https://c.saavncdn.com/712/Husn-Hindi-2023-20231201053005-500x500.jpg', "preview": 'https://cdns-preview-4.dzcdn.net/stream/c-4e4b1b1c2f0b7a4b5e8c7b8d9e5f5a6-3.mp3', "isFavorite": False, "source": 'popular' },
            { "id": 'popular_seven', "title": 'Seven', "artist": 'Jungkook ft. Latto', "album": 'Seven', "duration": '3:04', "coverUrl": 'https://i.scdn.co/image/ab67616d0000b2738c5c432d73af64860d7d5e3f', "preview": 'https://cdns-preview-5.dzcdn.net/stream/c-5f5c2c2d3g1c8b5c9d8c8e9f0a6b7c7-4.mp3', "isFavorite": False, "source": 'popular' }
        ]
        return jsonify({"songs": popular})

@app.route('/api/songs/info')
def get_song_info():
    seokey = request.args.get('seokey') or request.args.get('id')
    source = request.args.get('source', 'gaana')
    if not seokey:
        return jsonify({"error": "No identifier provided"}), 400
    
    if source == 'gaana':
        info = gaana.get_song_info(seokey)
        if info: return jsonify(info)
        return jsonify({"error": "Failed to fetch Gaana info"}), 500

    if source == 'youtube':
        info = youtube.get_song_info(seokey)
        if info:
            info['preview'] = f"/api/stream?id={seokey}"
            return jsonify(info)
        return jsonify({"error": "Failed to fetch YouTube info"}), 500
            
    return jsonify({"error": "Unsupported source"}), 400

@app.route('/api/stream')
def get_stream():
    video_id = request.args.get('id')
    if not video_id: return "Missing identity ID", 400
    if video_id.startswith('yt_'): video_id = video_id.replace('yt_', '')

    try:
        song_details = youtube.get_song_info(video_id)
        if not song_details or not song_details.get('preview'):
            return "Could not resolve stream", 404
            
        real_stream_url = song_details['preview']
        headers = {'User-Agent': 'Mozilla/5.0'}
        if 'Range' in request.headers: headers['Range'] = request.headers['Range']

        r = requests.get(real_stream_url, stream=True, headers=headers)
        res = Response(
            r.iter_content(chunk_size=1024*32),
            status=r.status_code,
            content_type=r.headers.get('content-type', 'audio/mpeg')
        )
        for h in ['Content-Range', 'Content-Length', 'Accept-Ranges']:
            if h in r.headers: res.headers[h] = r.headers[h]
        res.headers['Access-Control-Allow-Origin'] = '*'
        return res
    except Exception as e:
        return str(e), 500

@app.route('/api/audio-proxy')
def audio_proxy():
    url = request.args.get('url')
    if not url: return "No URL", 400
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        if 'Range' in request.headers: headers['Range'] = request.headers['Range']
        r = requests.get(url, stream=True, headers=headers)
        res = app.response_class(
            r.iter_content(chunk_size=1024*64),
            status=r.status_code,
            content_type=r.headers.get('content-type', 'audio/mpeg')
        )
        for h in ['Content-Range', 'Content-Length', 'Accept-Ranges']:
            if h in r.headers: res.headers[h] = r.headers[h]
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
        trending_data = data.get('new_trending') or data.get('trending') or data.get('new_albums') or data.get('top_playlists') or []
        for item in trending_data:
            if not isinstance(item, dict): continue
            if item.get('type') == 'song' or 'song' in item:
                trending.append(jiosaavn.map_jiosaavn_to_song(item))
    
    if not trending:
        try:
            fallback = jiosaavn.search_for_song('trending', False, True)
            if isinstance(fallback, list): trending = fallback[:15]
        except: pass

    charts = []
    if data and 'charts' in data:
        for chart in data['charts']:
            if isinstance(chart, dict):
                charts.append({
                    "id": chart.get('id'),
                    "title": chart.get('title'),
                    "image": chart.get('image'),
                    "subtitle": chart.get('subtitle'),
                    "type": chart.get('type')
                })
            
    return jsonify({"trending": trending, "charts": charts})

@app.route('/api/playlist')
def get_playlist_songs():
    list_id = request.args.get('id')
    if not list_id: return jsonify({"songs": []})
    data = jiosaavn.get_playlist(list_id, False)
    if data and 'songs' in data:
        songs = [jiosaavn.map_jiosaavn_to_song(t) for t in data['songs']]
        return jsonify({"songs": songs, "name": data.get('listname')})
    return jsonify({"songs": []})

if __name__ == '__main__':
    app.run(port=3005)
