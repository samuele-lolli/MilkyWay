from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os
import math

app = Flask(__name__)
CORS(app, support_credentials=True)

# Constants
EARTH_RADIUS_KM = 6371.0
ALLEVAMENTI_NOMI = ["Fattoria Clarkson", "Allevamento Lolli", "Fattoria Vincenzi", "Fattoria Becchi"]
RETAILER_NOMI = ["Pam Panorama Via Irnerio", "Famila Savignano", "Coop 3.0 Mirandola", "Pam Panorama Santarcangelo di Romagna"]
TRUCK_ROUTE_PATH = "output/truck_route_data.json"
ALLEVAMENTI_ROAD_PATH = "output/route_data_allevamenti.json"
RETAILER_ROAD_PATH = "output/route_data_retailer.json"

# Calculate the great-circle distance between two points on the Earth's surface
def haversine(coord1, coord2):
    lat1, lon1 = coord1
    lat2, lon2 = coord2

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c

# Check if each point in truck_data is within 2 km of any point in the destination_path
def is_within_2km(truck_data, destination_path):
    for truck_point in truck_data:
        if any(haversine(truck_point, dest_point) <= 2 for dest_point in destination_path):
            continue
        return False
    return True

@app.route('/transportSimulate', methods=['POST'])
def transport_simulate():
    if not request.is_json:
        return jsonify({"message": "Request must be JSON"}), 400

    data = request.get_json()
    loc_value = data.get("loc")
    
    if loc_value not in ALLEVAMENTI_NOMI + RETAILER_NOMI:
        return jsonify({"message": "Argument not in list"}), 500
    
    # Determine the appropriate standard road file based on loc_value
    standard_road = ALLEVAMENTI_ROAD_PATH if loc_value in ALLEVAMENTI_NOMI else RETAILER_ROAD_PATH

    # Run the external script to generate the truck route data
    try:
        subprocess.run(["python", "utils/truck.py", loc_value], check=True)

        # Load the generated truck data
        with open(TRUCK_ROUTE_PATH, 'r') as f:
            truck_data = json.load(f)['points']

        # Load the standard road data
        with open(standard_road, 'r') as f:
            roads_data = json.load(f)
        
        # Find the destination path
        destination_path = next((farm["points"] for farm in roads_data if farm["name"] == loc_value), [])

        # Check if the truck route is within 2 km of the destination path
        result = is_within_2km(truck_data, destination_path)
        return jsonify(result)
    
    except subprocess.CalledProcessError:
        return jsonify({"message": "An error occurred"}), 500

if __name__ == '__main__':
    app.run(debug=True)
