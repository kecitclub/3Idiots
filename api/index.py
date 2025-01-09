import os
from flask import Flask, jsonify, request, abort
from dotenv import load_dotenv
from client import supabase

load_dotenv()

app = Flask(__name__)
app.config['DEBUG'] = os.getenv('MODE') == 'development'

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

@app.route('/api/get', methods=['GET'])
def example_json():
    response = supabase.table("hashed_images").select("*").execute()
    print(response)
    return jsonify(response.data), 200

@app.route('/api/post', methods=['POST'])
def handle_post():
    if not request.is_json:
        abort(400, description="Invalid request format. Expected JSON.")

    req_data = request.get_json()
    print(req_data)
    response = supabase.table("hashed_images").select("*").execute()
    return jsonify(response.data), 200

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
