"""
Database layer for the cold chain logistics application.
Handles connection to Neon PostgreSQL and provides CRUD functions.
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')


def get_connection():
    """
    Create and return a new database connection.
    Uses the DATABASE_URL environment variable for the Neon connection string.
    """
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL environment variable is not set.")
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def get_all_foods():
    """
    Fetch all food items from the database.
    Returns a list of dictionaries.
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute('SELECT * FROM foods ORDER BY category, name')
            foods = cur.fetchall()
            return [dict(row) for row in foods]
    finally:
        conn.close()


def save_calculation_result(selected_foods, origin, destination, result):
    """
    Save a logistics calculation result to the database.
    
    Args:
        selected_foods: list of food IDs
        origin: dict with lat, lng, name
        destination: dict with lat, lng, name
        result: dict with calculation results
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                '''
                INSERT INTO calculations 
                    (selected_foods, origin_lat, origin_lng, origin_name,
                     dest_lat, dest_lng, dest_name, result)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id
                ''',
                (
                    json.dumps(selected_foods),
                    origin['lat'],
                    origin['lng'],
                    origin.get('name', 'Unknown'),
                    destination['lat'],
                    destination['lng'],
                    destination.get('name', 'Unknown'),
                    json.dumps(result),
                )
            )
            calc_id = cur.fetchone()['id']
            conn.commit()
            return calc_id
    finally:
        conn.close()
