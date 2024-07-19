import osmnx as ox
import networkx as nx
import folium
import json

def create_route_map(start_point, end_points, names, colors, network_type='drive', distance=15000, speed_kmh=50, update_interval=5):
    # Download the street graph of the area around the start point
    G = ox.graph_from_point(start_point, dist=distance, network_type=network_type)

    # Add a speed attribute to the graph edges (in m/s, e.g., 50 km/h = 13.89 m/s)
    speed_mps = speed_kmh / 3.6
    for u, v, k, data in G.edges(keys=True, data=True):
        data['speed'] = speed_mps

    # Create a map centered on the start point
    route_map = folium.Map(location=start_point, zoom_start=14)
    
    # Calculate positions of the vehicle at each update interval
    def calculate_positions(route, graph, interval):
        positions = []
        elapsed_time = 0
        distance_covered = 0
        remaining_distance = 0

        for i in range(len(route) - 1):
            u, v = route[i], route[i + 1]
            edge_length = graph[u][v][0]['length']
            distance_to_cover = remaining_distance
            speed = graph[u][v][0]['speed']

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

    # Initialize data for storing route information
    route_data_allevamenti = []
    route_data_retailer = []

    # Iterate through all end points
    for end_point, name, color in zip(end_points, names, colors):
        # Convert start and end points to nearest nodes in the graph
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

        # Store route information
        route_info = {
            "name": name,
            "points": [start_point] + car_positions + [end_point]
        }
        if color == 'blue':
            route_data_allevamenti.append(route_info)
        else:
            route_data_retailer.append(route_info)

    # Save the map as an HTML file
    route_map_path = '../output/route_map.html'
    route_map.save(route_map_path)

    # Save the route data in JSON files
    json_allevamenti_path = '../output/route_data_allevamenti.json'
    json_retailer_path = '../output/route_data_retailer.json'
    
    with open(json_allevamenti_path, 'w') as json_file:
        json.dump(route_data_allevamenti, json_file, indent=4)
    
    with open(json_retailer_path, 'w') as json_file:
        json.dump(route_data_retailer, json_file, indent=4)

    return route_map_path, json_allevamenti_path, json_retailer_path

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
route_map_path, json_allevamenti_path, json_retailer_path = create_route_map(start_point, end_points, names, colors, update_interval=5)
route_map_path, json_allevamenti_path, json_retailer_path
