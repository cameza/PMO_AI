#!/usr/bin/env python3
"""
Seed script for populating the SQLite database with synthetic program data.
Reads from data/synthetic_programs.json and populates the database.
Idempotent: clears existing data and re-seeds.
"""

import json
import sqlite3
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).parent.parent.parent
DATA_FILE = PROJECT_ROOT / "data" / "synthetic_programs.json"
DB_PATH = PROJECT_ROOT / "data" / "portfolio.db"


def clear_tables(conn: sqlite3.Connection) -> None:
    """Clear all data from tables."""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM milestones")
    cursor.execute("DELETE FROM risks")
    cursor.execute("DELETE FROM programs")
    cursor.execute("DELETE FROM strategic_objectives")
    conn.commit()
    logger.info("Cleared existing data from all tables")


def create_tables(conn: sqlite3.Connection) -> None:
    """Create tables if they don't exist."""
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS programs (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL,
            owner TEXT,
            team TEXT,
            product_line TEXT,
            pipeline_stage TEXT,
            strategic_objectives TEXT,
            launch_date TEXT,
            progress INTEGER DEFAULT 0,
            last_update TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS risks (
            id TEXT PRIMARY KEY,
            program_id TEXT NOT NULL,
            title TEXT NOT NULL,
            severity TEXT NOT NULL,
            description TEXT,
            mitigation TEXT,
            status TEXT NOT NULL,
            FOREIGN KEY (program_id) REFERENCES programs(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS milestones (
            id TEXT PRIMARY KEY,
            program_id TEXT NOT NULL,
            name TEXT NOT NULL,
            due_date TEXT,
            completed_date TEXT,
            status TEXT NOT NULL,
            FOREIGN KEY (program_id) REFERENCES programs(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS strategic_objectives (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            priority INTEGER DEFAULT 1,
            owner TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_risks_program ON risks(program_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_milestones_program ON milestones(program_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_strategic_objectives_priority ON strategic_objectives(priority)')
    
    conn.commit()
    logger.info("Database tables created/verified")


def seed_strategic_objectives(conn: sqlite3.Connection) -> None:
    """Seed strategic objectives from PRD constants."""
    cursor = conn.cursor()
    
    strategic_objectives = [
        ("obj-001", "Expand IoT ecosystem", "Grow our IoT device ecosystem and partnerships", 1, "Product Strategy"),
        ("obj-002", "Improve user retention", "Increase user engagement and reduce churn", 2, "Product Team"),
        ("obj-003", "Accelerate cloud migration", "Migrate infrastructure to cloud platforms", 3, "Engineering"),
        ("obj-004", "Enhance mobile experience", "Improve mobile app UX and performance", 2, "Mobile Team"),
        ("obj-005", "Strengthen core platform", "Improve platform reliability and scalability", 1, "Platform Engineering"),
        ("obj-006", "Drive subscription growth", "Increase subscriber base and revenue", 2, "Growth Team"),
        ("obj-007", "Enable AI capabilities", "Integrate AI features across products", 3, "AI Team"),
        ("obj-008", "Modernize infrastructure", "Update legacy systems and architecture", 3, "Infrastructure"),
        ("obj-009", "International expansion", "Expand to international markets", 2, "Business Development"),
    ]
    
    for obj_id, name, description, priority, owner in strategic_objectives:
        cursor.execute('''
            INSERT OR IGNORE INTO strategic_objectives (
                id, name, description, priority, owner
            ) VALUES (?, ?, ?, ?, ?)
        ''', (obj_id, name, description, priority, owner))
    
    conn.commit()
    logger.info(f"Seeded {len(strategic_objectives)} strategic objectives")


def seed_programs(conn: sqlite3.Connection, programs: list) -> None:
    """Insert programs into the database."""
    cursor = conn.cursor()
    
    for program in programs:
        cursor.execute('''
            INSERT INTO programs (
                id, name, description, status, owner, team,
                product_line, pipeline_stage, strategic_objectives,
                launch_date, progress, last_update
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            program['id'],
            program['name'],
            program['description'],
            program['status'],
            program['owner'],
            program['team'],
            program['product_line'],
            program['pipeline_stage'],
            json.dumps(program['strategic_objectives']),
            program['launch_date'],
            program['progress'],
            program['last_update']
        ))
        
        for risk in program.get('risks', []):
            cursor.execute('''
                INSERT INTO risks (
                    id, program_id, title, severity, description, mitigation, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                risk['id'],
                risk['program_id'],
                risk['title'],
                risk['severity'],
                risk['description'],
                risk['mitigation'],
                risk['status']
            ))
        
        for milestone in program.get('milestones', []):
            cursor.execute('''
                INSERT INTO milestones (
                    id, program_id, name, due_date, completed_date, status
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                milestone['id'],
                milestone['program_id'],
                milestone['name'],
                milestone['due_date'],
                milestone['completed_date'],
                milestone['status']
            ))
    
    conn.commit()
    logger.info(f"Seeded {len(programs)} programs")


def main():
    """Main entry point for seeding the database."""
    logger.info(f"Reading data from {DATA_FILE}")
    
    if not DATA_FILE.exists():
        logger.error(f"Data file not found: {DATA_FILE}")
        return
    
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    programs = data.get('programs', [])
    logger.info(f"Found {len(programs)} programs to seed")
    
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    
    try:
        create_tables(conn)
        clear_tables(conn)
        seed_strategic_objectives(conn)
        seed_programs(conn, programs)
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM programs")
        program_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM risks")
        risk_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM milestones")
        milestone_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM strategic_objectives")
        objectives_count = cursor.fetchone()[0]
        
        logger.info(f"Database seeded successfully:")
        logger.info(f"  - Programs: {program_count}")
        logger.info(f"  - Risks: {risk_count}")
        logger.info(f"  - Milestones: {milestone_count}")
        logger.info(f"  - Strategic Objectives: {objectives_count}")
        
    except sqlite3.Error as e:
        logger.error(f"Database error: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
