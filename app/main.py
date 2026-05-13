from contextlib import asynccontextmanager
from fastapi import FastAPI
import os
from app.core.database import create_db_and_tables
from app.api.routes.dataset_routes import router as dataset_router
from app.api.routes.llm_routes import router as llm_router

os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando a API e criando as tabelas no banco...")
    create_db_and_tables()

    yield
    print("Desligando a API com segurança...")


app = FastAPI(lifespan=lifespan, title="Minha API com SQLModel")

app.include_router(dataset_router, prefix="/api", tags=["Datasets"])

app.include_router(llm_router, prefix="/api", tags=["LLM"])


@app.get("/")
def read_root():
    return {"status": "Online com SQLModel e Lifespan!"}
