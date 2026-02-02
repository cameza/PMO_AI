import sqlite3
import json
import logging
from pathlib import Path
from typing import List, Optional

from .models import Program, Risk, Milestone

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent.parent.parent / "data" / "portfolio.db"


def get_connection() -> sqlite3.Connection:
    """Get a connection to the SQLite database."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the database schema."""
    conn = get_connection()
    cursor = conn.cursor()
    
    try:
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
        
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_risks_program ON risks(program_id)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_milestones_program ON milestones(program_id)')
        
        conn.commit()
        logger.info("Database schema initialized successfully")
    except sqlite3.Error as e:
        logger.error(f"Error initializing database: {e}")
        raise
    finally:
        conn.close()


def get_all_programs() -> List[Program]:
    """Retrieve all programs with their risks and milestones."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM programs')
        program_rows = cursor.fetchall()
        
        programs = []
        for row in program_rows:
            program_id = row['id']
            
            cursor.execute('SELECT * FROM risks WHERE program_id = ?', (program_id,))
            risk_rows = cursor.fetchall()
            risks = [
                Risk(
                    id=r['id'],
                    program_id=r['program_id'],
                    title=r['title'],
                    severity=r['severity'],
                    description=r['description'],
                    mitigation=r['mitigation'],
                    status=r['status']
                )
                for r in risk_rows
            ]
            
            cursor.execute('SELECT * FROM milestones WHERE program_id = ?', (program_id,))
            milestone_rows = cursor.fetchall()
            milestones = [
                Milestone(
                    id=m['id'],
                    program_id=m['program_id'],
                    name=m['name'],
                    due_date=m['due_date'],
                    completed_date=m['completed_date'],
                    status=m['status']
                )
                for m in milestone_rows
            ]
            
            strategic_objectives = json.loads(row['strategic_objectives']) if row['strategic_objectives'] else []
            
            program = Program(
                id=row['id'],
                name=row['name'],
                description=row['description'],
                status=row['status'],
                owner=row['owner'],
                team=row['team'],
                product_line=row['product_line'],
                pipeline_stage=row['pipeline_stage'],
                strategic_objectives=strategic_objectives,
                launch_date=row['launch_date'],
                progress=row['progress'],
                risks=risks,
                milestones=milestones,
                last_update=row['last_update']
            )
            programs.append(program)
        
        return programs
    except sqlite3.Error as e:
        logger.error(f"Error fetching programs: {e}")
        raise
    finally:
        conn.close()


def get_program_by_id(program_id: str) -> Optional[Program]:
    """Retrieve a single program by ID with its risks and milestones."""
    conn = get_connection()
    try:
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM programs WHERE id = ?', (program_id,))
        row = cursor.fetchone()
        
        if not row:
            return None
        
        cursor.execute('SELECT * FROM risks WHERE program_id = ?', (program_id,))
        risk_rows = cursor.fetchall()
        risks = [
            Risk(
                id=r['id'],
                program_id=r['program_id'],
                title=r['title'],
                severity=r['severity'],
                description=r['description'],
                mitigation=r['mitigation'],
                status=r['status']
            )
            for r in risk_rows
        ]
        
        cursor.execute('SELECT * FROM milestones WHERE program_id = ?', (program_id,))
        milestone_rows = cursor.fetchall()
        milestones = [
            Milestone(
                id=m['id'],
                program_id=m['program_id'],
                name=m['name'],
                due_date=m['due_date'],
                completed_date=m['completed_date'],
                status=m['status']
            )
            for m in milestone_rows
        ]
        
        strategic_objectives = json.loads(row['strategic_objectives']) if row['strategic_objectives'] else []
        
        return Program(
            id=row['id'],
            name=row['name'],
            description=row['description'],
            status=row['status'],
            owner=row['owner'],
            team=row['team'],
            product_line=row['product_line'],
            pipeline_stage=row['pipeline_stage'],
            strategic_objectives=strategic_objectives,
            launch_date=row['launch_date'],
            progress=row['progress'],
            risks=risks,
            milestones=milestones,
            last_update=row['last_update']
        )
    except sqlite3.Error as e:
        logger.error(f"Error fetching program {program_id}: {e}")
        raise
    finally:
        conn.close()
