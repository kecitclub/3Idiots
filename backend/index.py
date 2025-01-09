import os
from flask import Flask, jsonify, request, abort
from dotenv import load_dotenv
from client import supabase
import torch
from torchvision import models, transforms
from PIL import Image
from scipy.spatial.distance import cosine
import requests
from io import BytesIO

load_dotenv()

app = Flask(__name__)
app.config['DEBUG'] = os.getenv('MODE') == 'development'


def load_model():
    model = models.resnet50(weights=True)
    model = torch.nn.Sequential(*list(model.children())[:-1])
    model.eval()
    return model

def download_image(url):
    response = requests.get(url)
    return Image.open(BytesIO(response.content))

def preprocess_image(image_url):
    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])
    image = download_image(image_url).convert('RGB')
    image = transform(image)
    return image.unsqueeze(0)

def extract_features(model, image_tensor):
    with torch.no_grad():
        features = model(image_tensor)
    return features.squeeze().numpy()

def calculate_similarity(features1, features2):
    similarity = 1 - cosine(features1, features2)
    return similarity

def compare_images(image_url1, image_url2):
    try:
        model = load_model()
        img1_tensor = preprocess_image(image_url1)
        img2_tensor = preprocess_image(image_url2)
        features1 = extract_features(model, img1_tensor)
        features2 = extract_features(model, img2_tensor)
        similarity = calculate_similarity(features1, features2)
        return similarity
    except Exception as e:
        print(f"Error comparing images: {str(e)}")
        return None


def compare_primary_with_all(primary_image, comparing_images):
    model = load_model()
    results = []

    try:
        primary_tensor = preprocess_image(primary_image)
        primary_features = extract_features(model, primary_tensor)

        for img_url in comparing_images:
            try:
                img_tensor = preprocess_image(img_url)
                img_features = extract_features(model, img_tensor)
                similarity = calculate_similarity(primary_features, img_features)
                results.append((img_url, similarity))
            except Exception as e:
                print(f"Error processing {img_url}: {str(e)}")
                results.append((img_url, None))

        return results
    except Exception as e:
        print(f"Error processing primary image: {str(e)}")
        return None


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
        # Create a mapping of image URLs to their full metadata
        image_metadata = {image["image_url"]: image for image in all_images}
        
        # Get list of all image URLs
        total_images = list(image_metadata.keys())

        results = compare_primary_with_all(primary_image, total_images)
        
        if results:
            similar_images = []
            for img_url, similarity in results:
                if similarity is not None and similarity > 0.8:
                    # Get the full metadata for this image
                    metadata = image_metadata[img_url]
                    similar_images.append({
                        'image_url': img_url,
                        'similarity_score': float(similarity),
                        'similarity_percentage': float(similarity * 100),
                        'metadata': metadata
                    })

            return jsonify({
                'status': 'success',
                'similar_images': similar_images,
                'total_matches': len(similar_images)
            }), 200
        
        return jsonify({
            'status': 'success',
            'similar_images': [],
            'total_matches': 0
        }), 200

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