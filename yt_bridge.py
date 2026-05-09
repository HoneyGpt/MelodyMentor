import sys
import json
from ytmusicapi import YTMusic
import yt_dlp

yt = YTMusic()

def search_songs(query):
    try:
        results = yt.search(query, filter="songs")
        songs = []
        for res in results:
            thumbnails = res.get('thumbnails', [])
            cover_url = thumbnails[-1]['url'] if thumbnails else ""
            
            songs.append({
                'id': f"yt_{res['videoId']}",
                'title': res['title'],
                'artist': ", ".join([a['name'] for a in res.get('artists', [])]),
                'album': res.get('album', {}).get('name', 'Unknown Album'),
                'duration': res.get('duration', '0:00'),
                'coverUrl': cover_url,
                'preview': res['videoId'],
                'isFavorite': False,
                'source': 'youtube'
            })
        return songs
    except Exception as e:
        sys.stderr.write(f"Search error: {str(e)}\n")
        return []

def get_stream_url(video_id):
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'nocheckcertificate': True,
    }
    try:
        sys.stderr.write(f"Extracting info for: {video_id}\n")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            if info and 'url' in info:
                sys.stderr.write("URL resolved successfully\n")
                return info['url']
            sys.stderr.write("URL not found in info\n")
            return ""
    except Exception as e:
        sys.stderr.write(f"Extraction error: {str(e)}\n")
        return ""

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "search":
        query = " ".join(sys.argv[2:])
        results = search_songs(query)
        sys.stdout.write(json.dumps(results))
    
    elif command == "stream":
        if len(sys.argv) < 3:
            sys.exit(1)
        video_id = sys.argv[2]
        url = get_stream_url(video_id)
        sys.stdout.write(url)
