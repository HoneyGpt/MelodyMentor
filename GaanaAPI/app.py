from flask import Flask, request, jsonify
import gaana
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return jsonify({"status": "GaanaAPI is running", "source": "GaanaPy"})

@app.route('/search')
def search():
    query = request.args.get('query')
    limit = request.args.get('limit', 10)
    if query:
        return jsonify(gaana.search_for_song(query, limit))
    return jsonify({"error": "Query required"}), 400

@app.route('/info')
def info():
    seokey = request.args.get('seokey')
    if seokey:
        return jsonify(gaana.get_song_info(seokey))
    return jsonify({"error": "Seokey required"}), 400

if __name__ == '__main__':
    app.run(port=5200)
