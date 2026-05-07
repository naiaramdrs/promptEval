from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando a API e criando as tabelas no banco...")
    create_db_and_tables()

    yield
    print("Desligando a API com segurança...")


app = FastAPI(lifespan=lifespan, title="Minha API com SQLModel")


@app.get("/")
def read_root():
    return {"status": "Online com SQLModel e Lifespan!"}
