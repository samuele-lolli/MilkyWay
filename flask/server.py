from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json

app = Flask(__name__)
CORS(app, support_credentials=True)

@app.route('/transportSimulate', methods=['POST'])
def transportSimulate():
    if request.is_json:
        data = request.get_json()
        print(data)
        
        loc_value = data.get("loc", "")

        print(loc_value)
    
        comando = ["python", "utils/truck.py", loc_value]
        
        try:
            result = subprocess.run(comando)
            return jsonify({"message": "Hello, World!"})
        except subprocess.CalledProcessError as e:
            return jsonify({"message": "An error occurred"}), 500

    return jsonify({"message": "Request must be JSON"}), 400

if __name__ == '__main__':
    app.run(debug=True)
