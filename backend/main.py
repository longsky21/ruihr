from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import sys
import os

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers import auth, users, employees, admin, departments, attendance

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://192.168.31.209:5174",
    "https://192.168.31.209:5174",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://localhost:8003",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(employees.router)
app.include_router(departments.router)
app.include_router(attendance.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"Hello": "RuiHR Backend"}
