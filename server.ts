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
    // Determine the correct python command for the environment
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    console.log(`Executing: ${pythonCmd} yt_bridge.py ${command} ${args.join(' ')}`);
    
    const python = spawn(pythonCmd, ['yt_bridge.py', command, ...args]);
    
    let data = '';
    let error = '';

    python.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    python.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    // Timeout to prevent hanging processes
    const timeout = setTimeout(() => {
      python.kill();
      reject(new Error('Python bridge timed out'));
    }, 15000);

    python.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        console.error(`Python script error (${pythonCmd}): ${error}`);
        reject(new Error(`Python script failed with code ${code}: ${error}`));
        return;
      }
      try {
        const trimmed = data.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          resolve(JSON.parse(trimmed));
        } else {
          resolve(trimmed);
        }
      } catch (e) {
        resolve(data.trim());
      }
    });
  });
};

// --- Routes ---

app.get('/api/songs', async (req, res) => {
  const query = (req.query.search as string) || "trending hits global 2024";
  
  try {
    const youtube = await runPythonBridge('search', [query]);
    res.json({ songs: youtube || [] });
  } catch (e) {
    console.error("Search error:", e);
    res.status(500).json({ error: "Failed to fetch songs", message: e instanceof Error ? e.message : String(e) });
  }
});

app.get('/api/stream', async (req, res) => {
  const videoId = req.query.id as string;
  if (!videoId) return res.status(400).json({ error: "Missing video id" });

  try {
    const streamUrl = await runPythonBridge('stream', [videoId]);
    if (!streamUrl || typeof streamUrl !== 'string') {
        throw new Error("Invalid or empty stream URL resolved");
    }

    console.log(`Streaming from resolved URL: ${streamUrl.substring(0, 50)}...`);

    const response = await axios({
      method: 'get',
      url: streamUrl,
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Referer': 'https://www.youtube.com/',
        'Range': 'bytes=0-'
      }
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    response.data.pipe(res);
  } catch (e) {
    console.error("Streaming error:", e);
    res.status(500).json({ error: "Failed to stream audio", message: e instanceof Error ? e.message : String(e) });
  }
});

// Debug endpoint to check environment status
app.get('/api/debug', async (req, res) => {
  try {
    const checkPython = await runPythonBridge('debug', []);
    res.json({ 
      status: 'ok', 
      platform: process.platform, 
      python: checkPython,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT
      }
    });
  } catch (e) {
    res.status(500).json({ 
      status: 'error', 
      message: e instanceof Error ? e.message : String(e),
      platform: process.platform 
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'express' });
});

setupSocket(io);

server.listen(currentPort, () => {
  console.log(`> MelodyMentor API Live on port ${currentPort}`);
});
