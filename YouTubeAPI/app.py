from flask import Flask, request, jsonify
import youtube
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"status": "YouTubeAPI is running", "source": "yt-dlp"})

@app.route('/search')
def search():
    query = request.args.get('query')
    limit = request.args.get('limit', 10)
    if query:
        return jsonify(youtube.search_for_song(query, limit))
    return jsonify({"error": "Query required"}), 400

@app.route('/info')
def info():
    id = request.args.get('id')
    if id:
        return jsonify(youtube.get_song_info(id))
    return jsonify({"error": "ID required"}), 400

if __name__ == '__main__':
    app.run(port=5300)
