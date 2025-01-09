import os
from flask import Flask, jsonify, request, abort
from dotenv import load_dotenv
from client import supabase

load_dotenv()

app = Flask(__name__)
app.config['DEBUG'] = os.getenv('MODE') == 'development'


def calculate_hamming_distance(hash1: str, hash2: str) -> int:
    if len(hash1) != len(hash2):
        raise ValueError("Hash lengths must be equal")

    return sum(c1 != c2 for c1, c2 in zip(hash1, hash2))


def find_similar_images(input_hash: str, stored_hashes: list, threshold: int = 10) -> list:
    similar_images = []

    for stored_item in stored_hashes:
        try:
            distance = calculate_hamming_distance(input_hash, stored_item['image_hash'])
            if distance <= threshold:
                similar_images.append({
                    'hash': stored_item['image_hash'],
                    'image_id': stored_item.get('id'),
                    'distance': distance,
                    'metadata': stored_item
                })
        except ValueError as e:
            print(f"Error comparing hashes: {e}")
            continue

    return sorted(similar_images, key=lambda x: x['distance'])


@app.route('/', methods=['GET'])
def hello_world():
    return '<h1>Hello, World!</h1>'


@app.route('/api/health', methods=['GET'])
def health_check():
    response = {
        "status": "success",
        "message": "Server is running blazingly fast 🔥"
    }
    return jsonify(response), 200


@app.route('/api/same', methods=['POST'])
def handle_same_post():
    if not request.is_json:
        abort(400, description="Invalid request format. Expected JSON.")

    req_data = request.get_json()

    if 'hash' not in req_data:
        abort(400, description="Missing 'hash' field in request body")

    input_hash = req_data['hash']
    threshold = req_data.get('threshold', 10)

    try:
        response = supabase.table("hashed_images").select("*").execute()
        stored_hashes = response.data

        similar_images = find_similar_images(input_hash, stored_hashes, threshold)

        return jsonify({
            'status': 'success',
            'input_hash': input_hash,
            'threshold': threshold,
            'similar_images': similar_images,
            'total_matches': len(similar_images)
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/similar', methods=['POST'])
def handle_similar_post():
    if not request.is_json:
        abort(400, description="Invalid request format. Expected JSON.")

    req_data = request.get_json()
    
    if 'image_url' not in req_data:
        abort(400, description="Missing 'image_url' field in request body")
    
    primary_image = req_data['image_url']
    res = supabase.table("hashed_images").select("*").execute()
    all_images = res.data
    
    try:

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@app.errorhandler(400)
def bad_request(e):
    return jsonify(error=str(e), status="error"), 400


@app.errorhandler(404)
def resource_not_found(e):
    return jsonify(error=str(e), status="error"), 404


@app.errorhandler(500)
def internal_server_error(e):
    return jsonify(error=str(e), status="error"), 500


if __name__ == '__main__':
    is_dev = os.getenv('MODE')
    debug_mode = is_dev == 'development'
    app.run(debug=debug_mode)