// server.ts - Express + Socket.IO (Standalone)
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocket } from './src/lib/socket';
import { spawn } from 'child_process';
import axios from 'axios';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  path: '/api/socketio',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const currentPort = Number(process.env.PORT) || 3001;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://melodymentor.netlify.app',
    'https://melodymentor.mentozy.app'
  ],
  credentials: true
}));
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
        console.error(`Python script failed: ${error}`);
        reject(new Error(`Python script failed with code ${code}`));
        return;
      }
      try {
        if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
          resolve(JSON.parse(data));
        } else {
          resolve(data.trim());
        }
      } catch (e) {
        resolve(data.trim());
      }
    });
  });
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

// --- Routes ---

app.get('/api/songs', async (req, res) => {
  const query = (req.query.search as string) || "top charts 2024 global"; // Default to real trending hits
  let songs: Song[] = [];

  try {
    const [itunes, youtube] = await Promise.all([
      fetchFromiTunes(query),
      runPythonBridge('search', [query])
    ]);
    
    // Filter out iTunes duplicates if YouTube results exist, prioritizing full-length YouTube tracks
    const ytIds = new Set(youtube.map((s: Song) => s.title.toLowerCase()));
    const filteredItunes = itunes.filter((s: Song) => !ytIds.has(s.title.toLowerCase()));
    
    songs = [...youtube, ...filteredItunes].slice(0, 50);
  } catch (e) {
    console.error("Search error:", e);
    songs = await fetchFromiTunes(query);
  }

  res.json({ songs });
});

// Endpoint to stream audio directly through the server (fixes IP mismatch & CORS)
app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) return res.status(400).json({ error: "Missing video id" });

  try {
    const streamUrl = await runPythonBridge('stream', [videoId]);
    if (!streamUrl) throw new Error("Failed to resolve stream URL");

    // Proxy the stream to the client
    const response = await axios({
      method: 'get',
      url: streamUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youtube.com/'
      }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    response.data.pipe(res);
  } catch (e) {
    console.error("Streaming error:", e);
    res.status(500).json({ error: "Failed to stream audio" });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'express', python: 'active' });
});

setupSocket(io);

server.listen(currentPort, () => {
  console.log(`> API Server ready on port ${currentPort}`);
});
