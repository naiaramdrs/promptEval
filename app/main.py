from contextlib import asynccontextmanager
from fastapi import FastAPI
import os
from app.core.database import create_db_and_tables
from app.api.routes import dataset_routes, credential_routes, llm_routes

os.environ["GEMINI_API_KEY"] = os.getenv("GEMINI_API_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando a API e criando as tabelas no banco...")
    create_db_and_tables()

    yield
    print("Desligando a API com segurança...")


app = FastAPI(lifespan=lifespan, title="Minha API com SQLModel")

app.include_router(dataset_routes.router, prefix="/api", tags=["Datasets"])
app.include_router(credential_routes.router, prefix="/api", tags=["Credentials"])
app.include_router(llm_routes.router, prefix="/api", tags=["LLM"])
# app.include_router(metrics_routes.router, prefix="/api", tags=["Metrics"])


@app.get("/")
def read_root():
    return {"status": "Online com SQLModel e Lifespan!"}
