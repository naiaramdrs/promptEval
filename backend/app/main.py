from contextlib import asynccontextmanager
from fastapi import FastAPI
import os
from app.core.database import create_db_and_tables
from app.api.routes import (
    user_routes,
)
from app.api.routes import credential_routes, dataset_routes, llm_routes, metrics_routes, providers_route

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
app.include_router(metrics_routes.router, prefix="/api", tags=["Metrics"])
app.include_router(user_routes.router, prefix="/api", tags=["Users"])
app.include_router(providers_route.router, prefix="/api", tags=["Providers"])


@app.get("/")
def read_root():
    return {"status": "Online com SQLModel e Lifespan!"}
