import json
import os
from datetime import datetime

HISTORY_DIR = os.path.join(os.path.dirname(__file__), 'user_histories')

if not os.path.exists(HISTORY_DIR):
    os.makedirs(HISTORY_DIR)

def get_history_file(username):
    return os.path.join(HISTORY_DIR, f'{username}.json')

def add_route_to_history(username, route_data):
    file_path = get_history_file(username)
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            history = json.load(f)
    else:
        history = []
    route_data['timestamp'] = datetime.utcnow().isoformat()
    history.append(route_data)
    with open(file_path, 'w') as f:
        json.dump(history, f, indent=2)

def get_user_history(username):
    file_path = get_history_file(username)
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            return json.load(f)
    return []
