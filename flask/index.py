import os
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from dotenv import load_dotenv
import torch
from torchvision import models, transforms
from PIL import Image
from deepface import DeepFace
import shutil
from datetime import datetime
from scipy.spatial.distance import cosine
import requests
from io import BytesIO
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from urllib.request import urlopen
import imagehash

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

app = Flask(__name__)
CORS(app)  
app.config['DEBUG'] = os.getenv('MODE') == 'development'


def load_model():
    model = models.resnet50(weights=True)
    model = torch.nn.Sequential(*list(model.children())[:-1])
    model.eval()
    return model


def download_image(url, save_path=None):
    """
    Download an image from a URL and optionally save it to a path
    Returns PIL Image object
    """
    response = requests.get(url)
    image = Image.open(BytesIO(response.content))

    if save_path:
        image.save(save_path)

    return image


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


def find_similar_images(input_hash: str, stored_hash: str) -> float:
    """
    Compare two binary hash strings and return similarity percentage
    """
    try:
        # Calculate Hamming distance
        distance = sum(c1 != c2 for c1, c2 in zip(input_hash, stored_hash))
        # Convert to similarity percentage
        similarity = ((64 - distance) / 64) * 100
        return similarity
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0

def find_similar_images_batch(input_hash: str, stored_hashes: list, threshold: int = 10) -> list:
    """
    Compare input hash against a list of stored hashes
    """
    similar_images = []
    for stored_item in stored_hashes:
        try:
            similarity = find_similar_images(input_hash, stored_item['image_hash'])
            if similarity >= threshold:
                similar_images.append({
                    'hash': stored_item['image_hash'],
                    'image_id': stored_item.get('id'),
                    'similarity': similarity,
                    'metadata': stored_item
                })
        except ValueError as e:
            print(f"Error comparing hashes: {e}")
            continue
    return sorted(similar_images, key=lambda x: x['similarity'], reverse=True)


def setup_face_analysis():
    """
    Create temporary directory for face analysis
    """
    temp_dir = "temp_images"
    os.makedirs(temp_dir, exist_ok=True)
    return temp_dir


def cleanup_temp_files(temp_dir):
    """
    Clean up temporary image files
    """
    try:
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
    except Exception as e:
        print(f"Error during cleanup: {str(e)}")


def calculate_face_similarity_percentage(distance):
    """
    Convert distance metric to a similarity percentage
    """
    return max(0, min(100, (1 - distance) * 100))


def compare_faces(primary_image_url, comparing_images_urls, temp_dir):
    """
    Compare faces between primary image and comparison images
    """
    # Download primary image
    primary_path = os.path.join(temp_dir, "primary.jpg")
    primary_image = download_image(primary_image_url, primary_path)
    if primary_image is None:
        raise Exception("Failed to download primary image")

    results = []
    failed_comparisons = []
    successful_comparisons = 0

    for idx, img_url in enumerate(comparing_images_urls):
        comp_path = os.path.join(temp_dir, f"comparing_{idx}.jpg")

        try:
            comp_image = download_image(img_url, comp_path)
            if comp_image is None:
                raise Exception("Failed to download comparison image")

            result = DeepFace.verify(
                img1_path=primary_path,
                img2_path=comp_path,
                model_name="VGG-Face",
                distance_metric="cosine"
            )

            similarity_percentage = calculate_face_similarity_percentage(result["distance"])

            results.append({
                "image_url": img_url,
                "distance": float(result["distance"]),
                "similarity_percentage": float(similarity_percentage),
                "verified": result["verified"]
            })
            successful_comparisons += 1

        except Exception as e:
            failed_comparisons.append({
                "image_url": img_url,
                "error": str(e)
            })
            continue

    results.sort(key=lambda x: x["similarity_percentage"], reverse=True)

    return results, failed_comparisons, successful_comparisons


@app.route('/', methods=['GET'])
def hello_world():
    return jsonify({"message": "Hello World"})


@app.route('/api/health', methods=['GET'])
def health_check():
    response = {
        "status": "success",
        "message": "Server is running blazingly fast 🔥"
    }
    return jsonify(response), 200


def get_standardized_image_hash(image_url: str) -> str:
    """
    Standardized image hashing function that:
    1. Downloads image
    2. Converts to standard format (RGB)
    3. Resizes to standard size 
    4. Uses consistent hashing algorithm
    """
    try:
        with urlopen(image_url) as response:
            image = Image.open(response)
            # Convert to RGB mode
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to standard size (e.g., 256x256)
            image = image.resize((256, 256), Image.Resampling.LANCZOS)
            
            # Use pHash consistently
            hash_value = imagehash.phash(image)
            
            # Convert to standardized 64-bit binary string
            binary_hash = bin(int(str(hash_value), 16))[2:].zfill(64)
            
            return binary_hash
            
    except Exception as e:
        raise Exception(f"Error processing image: {str(e)}")

@app.route('/api/same', methods=['POST'])
def handle_same_post():
    if not request.is_json:
        abort(400, description="Invalid request format. Expected JSON.")
    
    req_data = request.get_json()
    if 'image_url' not in req_data:
        abort(400, description="Missing 'image_url' field in request body")
    
    image_url = req_data['image_url']
    threshold = req_data.get('threshold', 10)
    
    try:
        # Use standardized hashing
        input_binary_hash = get_standardized_image_hash(image_url)
        
        response = supabase.table("hashed_images").select("*").execute()
        stored_hashes = response.data if hasattr(response, 'data') else response
        
        similar_images = []
        for stored_image in stored_hashes:
            try:
                stored_hash = stored_image.get('image_hash')
                if stored_hash:
                    # Convert stored hex hash to binary in same format
                    stored_binary_hash = bin(int(stored_hash, 16))[2:].zfill(64)
                    similarity = find_similar_images(input_binary_hash, stored_binary_hash)
                    
                    if similarity >= threshold:
                        similar_images.append({
                            "image_url": stored_image["image_url"],
                            "similarity_score": similarity,
                            "metadata": stored_image
                        })
            except Exception as e:
                print(f"Error processing stored hash: {e}")
                continue
        
        return jsonify({
            'status': 'success',
            'input_hash': input_binary_hash,
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
    print("POST /api/similar")
    if not request.is_json:
        abort(400, description="Invalid request format. Expected JSON.")

    req_data = request.get_json()

    if 'image_url' not in req_data:
        abort(400, description="Missing 'image_url' field in request body")

    primary_image = req_data['image_url']
    res = supabase.table("hashed_images").select("*").execute()
    all_images = res.data

    try:
        image_metadata = {image["image_url"]: image for image in all_images}

        total_images = list(image_metadata.keys())

        results = compare_primary_with_all(primary_image, total_images)

        if results:
            similar_images = []
            for img_url, similarity in results:
                if similarity is not None and similarity > 0.8:
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


@app.route('/api/face', methods=['POST'])
def handle_face_similarity():
    if not request.is_json:
        abort(400, description="Invalid request format. Expected JSON.")

    req_data = request.get_json()

    if 'image_url' not in req_data:
        abort(400, description="Missing 'image_url' field in request body")

    primary_image = req_data['image_url']

    try:
        res = supabase.table("hashed_images").select("*").execute()
        all_images = res.data
        comparing_images = [img["image_url"] for img in all_images]
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f"Error fetching comparison images: {str(e)}"
        }), 500

    temp_dir = setup_face_analysis()

    try:
        results, failures, successful = compare_faces(
            primary_image,
            comparing_images,
            temp_dir
        )

        response_data = {
            'status': 'success',
            'analysis_timestamp': datetime.now().isoformat(),
            'primary_image': primary_image,
            'similar_faces': results,
            'failed_comparisons': failures,
            'statistics': {
                'total_comparisons': len(comparing_images),
                'successful_comparisons': successful,
                'failed_comparisons': len(failures)
            }
        }

        return jsonify(response_data), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

    finally:
        cleanup_temp_files(temp_dir)


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
    app.run(host='0.0.0.0', port=5000)