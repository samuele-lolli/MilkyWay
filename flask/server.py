from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os
import math

app = Flask(__name__)
CORS(app, support_credentials=True)

allevamenti_nomi = ["Fattoria Clarkson", "Allevamento Lolli", "Fattoria Vincenzi", "Fattoria Becchi"]
retailer_nomi = ["Pam Panorama Via Irnerio", "Famila Savignano", "Coop 3.0 Mirandola", "Pam Panorama Santarcangelo di Romagna"]

def haversine(coord1, coord2):
    R = 6371.0  # Raggio della Terra in km

    lat1, lon1 = coord1
    lat2, lon2 = coord2

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

def is_within_2km(truck_data, destination_path):
    for truck_point in truck_data:
        within_2km = False
        for dest_point in destination_path:
            if haversine(truck_point, dest_point) <= 2:
                within_2km = True
                break
        if not within_2km:
            return False
    return True

@app.route('/transportSimulate', methods=['POST'])
def transportSimulate():
    if request.is_json:
        data = request.get_json()
        loc_value = data.get("loc", "")
        comando = ["python", "utils/truck.py", loc_value]
        
        # Path del file JSON generato da truck.py
        json_file_path = "output/truck_route_data.json"

        if loc_value in allevamenti_nomi:
            standard_road = "output/route_data_allevamenti.json"
        elif loc_value in retailer_nomi:
            standard_road = "output/route_data_retailer.json"
        else: 
            return jsonify({"message": "Argument not in list"}), 500
        
        try:
            subprocess.run(comando, check=True)
            with open(json_file_path, 'r') as f:
                truck_data = json.load(f)
            

            with open(standard_road, 'r') as f:
                roads_data = json.load(f)
            
            # Variabile per memorizzare il percorso di destinazione
            destination_path = []

            # Ricerca del percorso corrispondente al nome in loc
            for farm in roads_data:
                if farm["name"] == loc_value:
                    destination_path = farm["points"]
                    break

            result = is_within_2km(truck_data['points'], destination_path)
            
            return jsonify(result)
                
        except subprocess.CalledProcessError as e:
            return jsonify({"message": "An error occurred"}), 500

    return jsonify({"message": "Request must be JSON"}), 400

if __name__ == '__main__':
    app.run(debug=True)
