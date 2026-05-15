import yt_dlp
import os

# Configure yt-dlp options for music search
ydl_opts = {
    'format': 'bestaudio/best',
    'quiet': True,
    'no_warnings': True,
    'extract_flat': True,
    'skip_download': True,
}

def format_duration(seconds):
    if not seconds: return "0:00"
    m, s = divmod(int(seconds), 60)
    return f"{m}:{s:02d}"

def map_youtube_to_song(entry):
    # entry is from flat_extract (search results)
    # Note: search results might not have the direct stream URL yet
    # We will fetch it on-demand in playTrack/info
    
    video_id = entry.get('id')
    thumbnail = entry.get('thumbnail') or f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"
    
    return {
        "id": f"yt_{video_id}",
        "yt_id": video_id, # Keep for re-fetching
        "title": entry.get('title', 'Unknown Title'),
        "artist": entry.get('uploader', 'YouTube'),
        "album": "YouTube Music",
        "duration": format_duration(entry.get('duration')),
        "coverUrl": thumbnail,
        "preview": "", # Will be fetched via info/playTrack logic
        "isFavorite": False,
        "source": "youtube"
    }

def search_for_song(query, limit=10):
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Use ytsearch to find videos
            search_query = f"ytsearch{limit}:{query}"
            info = ydl.extract_info(search_query, download=False)
            if 'entries' in info:
                return [map_youtube_to_song(entry) for entry in info['entries']]
    except Exception as e:
        print(f"YouTube search error: {e}")
    return []

def get_song_info(video_id):
    # Fetch real stream URL
    ydl_opts_info = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts_info) as ydl:
            info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)
            # Find the best audio format
            formats = info.get('formats', [])
            audio_formats = [f for f in formats if f.get('acodec') != 'none' and f.get('vcodec') == 'none']
            best_audio = audio_formats[-1] if audio_formats else formats[-1]
            
            song = map_youtube_to_song(info)
            song['preview'] = best_audio.get('url', '')
            return song
    except Exception as e:
        print(f"YouTube info error: {e}")
    return None
