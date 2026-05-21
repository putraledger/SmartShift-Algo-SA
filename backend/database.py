from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Kita menggunakan SQLite. File database akan bernama 'jadwal_ta.db'
SQLALCHEMY_DATABASE_URL = "sqlite:///./jadwal_ta.db"

# Membuat engine (mesin penghubung ke database)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Membuat pembuat sesi (sessionmaker) untuk interaksi data
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class untuk membuat model/tabel kita nanti
Base = declarative_base()