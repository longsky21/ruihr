import os
import mysql.connector
from dotenv import load_dotenv

# Load environment variables from the parent directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

def init_db():
    print(f"Connecting to database at {DB_HOST}:{DB_PORT} as {DB_USER}...")
    try:
        # Connect without database first to create it if not exists
        mydb = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        cursor = mydb.cursor()

        # Create database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Database {DB_NAME} created or already exists.")
        
        mydb.close()

        # Connect to the specific database
        mydb = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        cursor = mydb.cursor()

        # Execute SQL commands
        sql_commands = [
            """
            CREATE TABLE IF NOT EXISTS users (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              username VARCHAR(50) NOT NULL UNIQUE,
              email VARCHAR(120) UNIQUE,
              password_hash VARCHAR(255) NOT NULL,
              status TINYINT NOT NULL DEFAULT 1, -- 1=active,0=disabled
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS roles (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              name VARCHAR(50) NOT NULL UNIQUE,
              description VARCHAR(255)
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS user_roles (
              user_id BIGINT UNSIGNED NOT NULL,
              role_id BIGINT UNSIGNED NOT NULL,
              PRIMARY KEY (user_id, role_id),
              CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
              CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS departments (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              name VARCHAR(100) NOT NULL UNIQUE,
              parent_id BIGINT UNSIGNED NULL,
              CONSTRAINT fk_departments_parent FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS employees (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              user_id BIGINT UNSIGNED UNIQUE,
              employee_no VARCHAR(50) UNIQUE,
              name VARCHAR(100) NOT NULL,
              gender ENUM('male','female','other') NULL,
              phone VARCHAR(30) NULL,
              department_id BIGINT UNSIGNED NULL,
              position VARCHAR(100) NULL,
              hire_date DATE NULL,
              status TINYINT NOT NULL DEFAULT 1,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              CONSTRAINT fk_employees_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
              CONSTRAINT fk_employees_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS jobs (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              title VARCHAR(150) NOT NULL,
              department_id BIGINT UNSIGNED NULL,
              description TEXT NULL,
              status ENUM('open','paused','closed') NOT NULL DEFAULT 'open',
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              CONSTRAINT fk_jobs_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS candidates (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              name VARCHAR(100) NOT NULL,
              email VARCHAR(120) NULL,
              phone VARCHAR(30) NULL,
              resume_url VARCHAR(255) NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS applications (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              job_id BIGINT UNSIGNED NOT NULL,
              candidate_id BIGINT UNSIGNED NOT NULL,
              status ENUM('applied','screening','interview','offer','hired','rejected') NOT NULL DEFAULT 'applied',
              applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              CONSTRAINT fk_app_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
              CONSTRAINT fk_app_cand FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
              UNIQUE KEY uniq_job_candidate (job_id, candidate_id)
            ) ENGINE=InnoDB;
            """,
            # New Tables
            """
            CREATE TABLE IF NOT EXISTS attendance_records (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              employee_id BIGINT UNSIGNED NOT NULL,
              clock_in_time DATETIME NOT NULL,
              clock_out_time DATETIME NULL,
              location VARCHAR(255) NULL,
              device_id VARCHAR(100) NULL,
              device_name VARCHAR(100) NULL,
              source VARCHAR(50) NULL,
              is_valid BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS leave_requests (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              employee_id BIGINT UNSIGNED NOT NULL,
              leave_type VARCHAR(50) NOT NULL,
              start_date DATETIME NOT NULL,
              end_date DATETIME NOT NULL,
              reason TEXT NULL,
              status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
              approver_id BIGINT UNSIGNED NULL,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
              CONSTRAINT fk_leave_approver FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB;
            """,
            """
            CREATE TABLE IF NOT EXISTS payrolls (
              id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
              employee_id BIGINT UNSIGNED NOT NULL,
              month VARCHAR(7) NOT NULL, -- YYYY-MM
              base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
              bonus DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
              deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
              net_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
              status ENUM('draft','published','paid') NOT NULL DEFAULT 'draft',
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
              UNIQUE KEY uniq_payroll_employee_month (employee_id, month)
            ) ENGINE=InnoDB;
            """,
            # Indexes
            "CREATE INDEX idx_users_status ON users(status);",
            "CREATE INDEX idx_employees_department ON employees(department_id);",
            "CREATE INDEX idx_jobs_status ON jobs(status);",
            "CREATE INDEX idx_attendance_emp_time ON attendance_records(employee_id, clock_in_time);",
            "CREATE INDEX idx_leave_emp_status ON leave_requests(employee_id, status);"
        ]

        for sql in sql_commands:
            try:
                if "CREATE INDEX" in sql:
                    cursor.execute(sql)
                else:
                    cursor.execute(sql)
                print(f"Executed SQL successfully.")
            except mysql.connector.Error as err:
                if err.errno == 1061: # Duplicate key name
                    print(f"Index already exists, skipping: {err}")
                elif err.errno == 1050: # Table already exists
                    print(f"Table already exists, skipping: {err}")
                else:
                    print(f"Error executing SQL: {err}")

        mydb.commit()
        print("Database initialization completed successfully.")
        cursor.close()
        mydb.close()

    except mysql.connector.Error as err:
        print(f"Error connecting to database: {err}")

if __name__ == "__main__":
    init_db()
