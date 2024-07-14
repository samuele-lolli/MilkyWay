import osmnx as ox
import networkx as nx
import folium
import json
import sys
import random

def calculate_positions(route, graph, interval):
    positions = []
    elapsed_time = 0
    distance_covered = 0
    speed = graph.edges[route[0], route[1], 0]['speed']
    remaining_distance = 0  # Distanza rimanente da portare al segmento successivo
    
    for i in range(len(route) - 1):
        u, v = route[i], route[i + 1]
        edge_length = graph[u][v][0]['length']
        distance_to_cover = remaining_distance  # Iniziamo con la distanza rimanente dal segmento precedente

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
        distance_covered = remaining_distance
    
    return positions

def create_truck_route_map(start_point, destination_name, end_points, names, colors, network_type='drive', distance=15000, speed_kmh=50, update_interval=5):
    # Scaricare il grafo stradale dell'area circostante i punti di interesse
    G = ox.graph_from_point(start_point, dist=distance, network_type=network_type)

    # Aggiungere un attributo di velocità ai bordi del grafo (in m/s, ad esempio 50 km/h = 13.89 m/s)
    speed_mps = speed_kmh / 3.6
    for u, v, k, data in G.edges(keys=True, data=True):
        data['speed'] = speed_mps  # Velocità media in m/s

    # Creare una mappa centrata sul punto di partenza
    route_map = folium.Map(location=start_point, zoom_start=14)

    # Dati per la destinazione speciale con 1% di probabilità
    special_destination = (44.877865, 11.129585)

    # Trovare l'indice della destinazione
    destination_index = names.index(destination_name)
    
    # Determinare la destinazione finale con probabilità
    if random.random() < 0.99:
        end_point = end_points[destination_index]
        color = colors[destination_index]
    else:
        end_point = special_destination
        color = 'red'  # Usa un colore distintivo per il percorso speciale

    # Convertire i punti di partenza e di arrivo ai nodi più vicini nel grafo
    orig_node = ox.distance.nearest_nodes(G, X=start_point[1], Y=start_point[0])
    dest_node = ox.distance.nearest_nodes(G, X=end_point[1], Y=end_point[0])

    # Calcolare il percorso più breve
    shortest_route = nx.shortest_path(G, orig_node, dest_node, weight='length')

    # Estrarre le coordinate del percorso
    route_coords = [(G.nodes[node]['y'], G.nodes[node]['x']) for node in shortest_route]

    # Calcolare le posizioni dell'auto ogni update_interval secondi
    car_positions = calculate_positions(shortest_route, G, interval=update_interval)

    # Aggiungere il percorso alla mappa
    folium.PolyLine(route_coords, color=color, weight=5).add_to(route_map)

    # Aggiungere i marker per i punti di partenza e arrivo
    folium.Marker(location=start_point, popup='Start', icon=folium.Icon(color='green')).add_to(route_map)
    folium.Marker(location=end_point, popup='End', icon=folium.Icon(color='red')).add_to(route_map)

    # Aggiungere i pin per le posizioni dell'auto ogni update_interval secondi
    for idx, position in enumerate(car_positions):
        folium.Marker(location=position, popup=f'Second {idx * update_interval}', icon=folium.Icon(color=color)).add_to(route_map)

    # Salvare la mappa in un file HTML
    route_map_path = 'truck.html'
    route_map.save(route_map_path)

    # Salvare i dati del percorso in un file JSON
    route_info = {
        "points": [start_point] + car_positions + [end_point]
    }

    json_path = 'truck_route_data.json'
    with open(json_path, 'w') as json_file:
        json.dump(route_info, json_file, indent=4)

    return route_map_path, json_path

if __name__ == "__main__":
    # Verificare che l'argomento sia stato passato
    if len(sys.argv) != 2:
        print("Usage: python script.py <destination_name>")
        sys.exit(1)
    
    destination_name = sys.argv[1]

    location_allevamenti = [(44.923570, 11.096173), (44.829820, 11.049559), (44.858796, 11.027466), (44.910022, 10.997559)]
    allevamenti_nomi = ["Fattoria Clarkson", "Allevamento Lolli", "Fattoria Vincenzi", "Fattoria Becchi"]
    location_retailer = [(44.893836, 11.061552), (44.890389, 11.054800), (44.890538, 11.077755), (44.892260, 11.068087)]
    retailer_nomi = ["Pam Panorama Via Irnerio", "Famila Savignano", "Coop 3.0 Mirandola", "Pam Panorama Santarcangelo di Romagna"]

    start_point = (44.888892, 11.065959)  # Parma, Italia

    # Colori per gli allevamenti (blu) e per i retailer (viola)
    colors = ['blue'] * len(location_allevamenti) + ['purple'] * len(location_retailer)
    end_points = location_allevamenti + location_retailer
    names = allevamenti_nomi + retailer_nomi

    # Creare la mappa unica e salvare i dati JSON
    route_map_path, json_path = create_truck_route_map(start_point, destination_name, end_points, names, colors, update_interval=5)
    print(f"Route map saved to {route_map_path}")
    print(f"Route data saved to {json_path}")
