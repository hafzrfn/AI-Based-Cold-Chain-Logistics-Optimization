"""
Database Seeder — ColdChain AI
================================
Creates the database tables and inserts initial food data into Neon PostgreSQL.

Usage:
    python seed_db.py
"""

import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')


def seed_database():
    """Create tables and seed initial data."""
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    print("[*] Creating tables...")

    # Create foods table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS foods (
            id SERIAL PRIMARY KEY,
            food_id VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            category VARCHAR(50) NOT NULL,
            emoji VARCHAR(10),
            optimal_temp DECIMAL(4,1) NOT NULL,
            shelf_life_days INTEGER NOT NULL
        )
    ''')

    # Create calculations table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS calculations (
            id SERIAL PRIMARY KEY,
            selected_foods JSONB NOT NULL,
            origin_lat DECIMAL(10,7),
            origin_lng DECIMAL(10,7),
            origin_name VARCHAR(255),
            dest_lat DECIMAL(10,7),
            dest_lng DECIMAL(10,7),
            dest_name VARCHAR(255),
            result JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    print("[OK] Tables created.")

    # Seed food data
    print("[*] Seeding food data...")

    foods = [
        # Meat
        ('chicken', 'Chicken', 'meat', '🍗', -2, 5),
        ('beef', 'Beef', 'meat', '🥩', -1.5, 7),
        ('pork', 'Pork', 'meat', '🐖', -2, 5),
        ('fish', 'Fish', 'meat', '🐟', -1, 3),
        ('lamb', 'Lamb', 'meat', '🐑', -1.5, 7),
        ('shrimp', 'Shrimp', 'meat', '🦐', -2, 3),
        # Vegetables & Fruits
        ('lettuce', 'Lettuce', 'vegetables_fruits', '🥬', 1, 10),
        ('tomato', 'Tomato', 'vegetables_fruits', '🍅', 10, 14),
        ('cauliflower', 'Cauliflower', 'vegetables_fruits', '🥦', 0, 14),
        ('apple', 'Apple', 'vegetables_fruits', '🍎', 1, 30),
        ('banana', 'Banana', 'vegetables_fruits', '🍌', 13, 7),
        ('strawberry', 'Strawberry', 'vegetables_fruits', '🍓', 0, 5),
        ('carrot', 'Carrot', 'vegetables_fruits', '🥕', 0, 21),
        ('spinach', 'Spinach', 'vegetables_fruits', '🥬', 0, 7),
        # Dairy
        ('milk', 'Milk', 'dairy', '🥛', 2, 10),
        ('yogurt', 'Yogurt', 'dairy', '🫙', 3, 14),
        ('cheese', 'Cheese', 'dairy', '🧀', 4, 30),
        ('butter', 'Butter', 'dairy', '🧈', 2, 30),
        ('cream', 'Cream', 'dairy', '🍶', 2, 7),
        ('ice_cream', 'Ice Cream', 'dairy', '🍦', -18, 60),
    ]

    for food in foods:
        cur.execute('''
            INSERT INTO foods (food_id, name, category, emoji, optimal_temp, shelf_life_days)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (food_id) DO UPDATE SET
                name = EXCLUDED.name,
                category = EXCLUDED.category,
                emoji = EXCLUDED.emoji,
                optimal_temp = EXCLUDED.optimal_temp,
                shelf_life_days = EXCLUDED.shelf_life_days
        ''', food)

    conn.commit()
    print(f"[OK] Seeded {len(foods)} food items.")

    # Verify
    cur.execute('SELECT COUNT(*) FROM foods')
    count = cur.fetchone()[0]
    print(f"[INFO] Total foods in database: {count}")

    cur.close()
    conn.close()
    print("[DONE] Database seeding complete!")


if __name__ == '__main__':
    seed_database()
