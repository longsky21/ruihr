# RuiHR System

## PC End Features
- **Organization Management**: Visualization tree, Import from CSV.
- **Employee Management**: List view, filtering, Import from CSV.

## Quick Start (Docker)

1. Ensure `.env` file is present in the root directory.
2. Run `docker-compose up -d --build`.
3. Access the application at `http://localhost`.

## Development

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8003
```

### Frontend
```bash
npm install
npm run dev
```

## Data Import
The system supports importing Organization and Employee data from CSV files.
- Place `组织架构.csv` and `导出的员工信息数据.csv` in the root directory (mapped in Docker or local).
- Use the "Import" buttons in the PC interface.

## Initialization Script

To reset the database and import initial data (including departments and employees):

```bash
# From project root
python backend/init_system.py
```

This script will:
1. Drop all existing tables.
2. Recreate the database schema.
3. Import departments from `组织架构.csv`.
4. Import employees from `导出的员工信息数据.csv`.

**Warning**: This will erase all existing data!
