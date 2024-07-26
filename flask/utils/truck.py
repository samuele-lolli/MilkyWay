import osmnx as ox
import networkx as nx
import folium
import json
import sys
import random

# Calculate vehicle positions along the route at specified intervals.
def calculate_positions(route, graph, interval):
    positions = []
    elapsed_time = 0
    remaining_distance = 0

    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_length = graph[u][v][0]['length']
        speed = graph[u][v][0]['speed']
        distance_to_cover = remaining_distance

        while distance_to_cover < edge_length:
            if distance_to_cover + speed * interval <= edge_length:
                distance_to_cover += speed * interval
                elapsed_time += interval
            else:
                elapsed_time += (edge_length - distance_to_cover) / speed
                distance_to_cover = edge_length
            
            fraction = distance_to_cover / edge_length
            lat = graph.nodes[u]['y'] + fraction * (graph.nodes[v]['y'] - graph.nodes[u]['y'])
            lon = graph.nodes[u]['x'] + fraction * (graph.nodes[v]['x'] - graph.nodes[u]['x'])
            positions.append((lat, lon))
        
        remaining_distance = distance_to_cover - edge_length
    
    return positions

# Create a truck route map and save route data.

def create_truck_route_map(start_point, destination_name, end_points, names, colors, network_type='drive', distance=15000, speed_kmh=50, update_interval=5):

    # Download the street graph of the area around the start point
    G = ox.graph_from_point(start_point, dist=distance, network_type=network_type)

    # Add a speed attribute to the graph edges (in m/s)
    speed_mps = speed_kmh / 3.6
    for u, v, k, data in G.edges(keys=True, data=True):
        data['speed'] = speed_mps

    # Create a map centered on the start point
    route_map = folium.Map(location=start_point, zoom_start=14)

    # Special destination with a 1% probability
    special_destination = (44.877865, 11.129585)
    destination_index = names.index(destination_name)

    # Determine the final destination with probability
    if random.random() < 0.99:
        end_point = end_points[destination_index]
        color = colors[destination_index]
    else:
        end_point = special_destination
        color = 'red'  # Distinctive color for the special route

    # Convert start and end points to the nearest nodes in the graph
    orig_node = ox.distance.nearest_nodes(G, X=start_point[1], Y=start_point[0])
    dest_node = ox.distance.nearest_nodes(G, X=end_point[1], Y=end_point[0])

    # Calculate the shortest path
    shortest_route = nx.shortest_path(G, orig_node, dest_node, weight='length')

    # Extract coordinates of the route
    route_coords = [(G.nodes[node]['y'], G.nodes[node]['x']) for node in shortest_route]

    # Calculate vehicle positions at each update interval
    car_positions = calculate_positions(shortest_route, G, interval=update_interval)

    # Add the route to the map
    folium.PolyLine(route_coords, color=color, weight=5).add_to(route_map)

    # Add markers for the start and end points
    folium.Marker(location=start_point, popup='Start', icon=folium.Icon(color='green')).add_to(route_map)
    folium.Marker(location=end_point, popup='End', icon=folium.Icon(color='red')).add_to(route_map)

    # Add markers for vehicle positions at each update interval
    for idx, position in enumerate(car_positions):
        folium.Marker(location=position, popup=f'Second {idx * update_interval}', icon=folium.Icon(color=color)).add_to(route_map)

    # Save the map as an HTML file
    route_map_path = 'output/truck.html'
    route_map.save(route_map_path)

    # Save the route data in a JSON file
    route_info = {
        "points": [start_point] + car_positions + [end_point]
    }
    json_path = 'output/truck_route_data.json'
    with open(json_path, 'w') as json_file:
        json.dump(route_info, json_file, indent=4)

    return route_map_path, json_path

if __name__ == "__main__":
    # Verify that the destination name is provided as an argument
    if len(sys.argv) != 2:
        print("Usage: python script.py <destination_name>")
        sys.exit(1)
    
    destination_name = sys.argv[1]

    # Example data for farms and retailers
    location_allevamenti = [
        (44.923570, 11.096173),
        (44.829820, 11.049559),
        (44.858796, 11.027466),
        (44.910022, 10.997559)
    ]
    allevamenti_nomi = ["Fattoria Clarkson", "Allevamento Lolli", "Fattoria Vincenzi", "Fattoria Becchi"]

    location_retailer = [
        (44.893836, 11.061552),
        (44.890389, 11.054800),
        (44.890538, 11.077755),
        (44.892260, 11.068087)
    ]
    retailer_nomi = ["Pam Panorama Via Irnerio", "Famila Savignano", "Coop 3.0 Mirandola", "Pam Panorama Santarcangelo di Romagna"]

    start_point = (44.888892, 11.065959)  # Parma, Italy

    # Colors for farms (blue) and retailers (purple)
    colors = ['blue'] * len(location_allevamenti) + ['purple'] * len(location_retailer)
    end_points = location_allevamenti + location_retailer
    names = allevamenti_nomi + retailer_nomi

    # Create the map and save the route data in JSON
    route_map_path, json_path = create_truck_route_map(start_point, destination_name, end_points, names, colors, update_interval=5)
    print(f"Route map saved to {route_map_path}")
    print(f"Route data saved to {json_path}")