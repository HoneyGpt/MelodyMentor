// server.ts - Express + Socket.IO (Standalone)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocket } from './src/lib/socket';
import { spawn } from 'child_process';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  path: '/api/socketio',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const currentPort = 3001; // Use 3001 for API, Vite will proxy to it
const hostname = '127.0.0.1';

app.use(cors());
app.use(express.json());

// --- Types ---
interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  coverUrl: string;
  preview: string;
  isFavorite: boolean;
  source: string;
}

// --- Helper for Python Bridge ---
const runPythonBridge = (command: string, args: string[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    const python = spawn('python', ['yt_bridge.py', command, ...args]);
    let data = '';
    let error = '';

    python.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    python.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed with code ${code}: ${error}`));
        return;
      }
      try {
        // Some commands return JSON, others plain strings
        if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
          resolve(jsonSafeParse(data));
        } else {
          resolve(data.trim());
        }
      } catch (e) {
        resolve(data.trim());
      }
    });
  });
};

const jsonSafeParse = (str: string) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str;
  }
};

// --- Ported API Logic ---

const fetchFromiTunes = async (query: string): Promise<Song[]> => {
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=5&media=music`
    );
    if (response.ok) {
      const data = await response.json();
      return data.results.map((track: any) => ({
        id: `itunes_${track.trackId}`,
        title: track.trackName,
        artist: track.artistName,
        album: track.collectionName || 'Unknown Album',
        duration: track.trackTimeMillis ? 
          `${Math.floor(track.trackTimeMillis / 60000)}:${Math.floor((track.trackTimeMillis % 60000) / 1000).toString().padStart(2, '0')}` : 
          '0:00',
        coverUrl: track.artworkUrl100?.replace('100x100', '600x600') || `https://via.placeholder.com/600`,
        preview: track.previewUrl,
        isFavorite: false,
        source: 'itunes'
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
};

const getPopularSongs = (): Song[] => [
  { id: 'popular_husn', title: 'Husn', artist: 'Anuv Jain', album: 'Husn', duration: '3:19', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2734c5c432d73af64860d7d5d2e', preview: 'https://cdns-preview-4.dzcdn.net/stream/c-4e4b1b1c2f0b7a4b5e8c7b8d9e5f5a6-3.mp3', isFavorite: false, source: 'popular' },
  { id: 'popular_seven', title: 'Seven', artist: 'Jungkook ft. Latto', album: 'Seven', duration: '3:04', coverUrl: 'https://i.scdn.co/image/ab67616d0000b2738c5c432d73af64860d7d5e3f', preview: 'https://cdns-preview-5.dzcdn.net/stream/c-5f5c2c2d3g1c8b5c9d8c8e9f0a6b7c7-4.mp3', isFavorite: false, source: 'popular' }
];

// --- Routes ---

app.get('/api/songs', async (req, res) => {
  const query = req.query.search as string;
  let songs: Song[] = [];

  if (query && query.trim() !== '') {
    try {
      const [itunes, youtube] = await Promise.all([
        fetchFromiTunes(query),
        runPythonBridge('search', [query])
      ]);
      
      // Combine results, prioritizing YouTube for "full songs"
      songs = [...youtube, ...itunes].slice(0, 30);
    } catch (e) {
      console.error("Search error:", e);
      songs = await fetchFromiTunes(query);
    }
  } else {
    songs = getPopularSongs();
  }

  res.json({ songs });
});

// Endpoint to get full audio stream URL
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) return res.status(400).json({ error: "Missing video id" });

  try {
    const streamUrl = await runPythonBridge('stream', [videoId]);
    res.json({ url: streamUrl });
  } catch (e) {
    console.error("Streaming error:", e);
    res.status(500).json({ error: "Failed to get stream URL" });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'express', python: 'active' });
});

// Setup Socket.IO
setupSocket(io);

// Start the server
server.listen(currentPort, hostname, () => {
  console.log(`> API Server ready on http://${hostname}:${currentPort}`);
  console.log(`> YouTube Music Bridge active via Python`);
});
