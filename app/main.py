from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import create_db_and_tables
from app.api.routes.dataset_routes import router as dataset_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando a API e criando as tabelas no banco...")
    create_db_and_tables()

    yield
    print("Desligando a API com segurança...")


app = FastAPI(lifespan=lifespan, title="Minha API com SQLModel")

app.include_router(dataset_router, prefix="/datasets", tags=["Datasets"])


@app.get("/")
def read_root():
    return {"status": "Online com SQLModel e Lifespan!"}
