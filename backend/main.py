import os
from fastapi import FastAPI
from app.core.database import engine, Base
from app.api import (
    clientes, lecturas, tarifas, consumos, reportes, presion,
    continuidad, reclamos, dashboard, configuracion,
    lectura_matriz, facturas, empresas, auth, usuarios, cajas, pagos, caf
)

from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL", "")

origins = ["http://localhost:5173", "http://localhost:4173"]
if FRONTEND_URL:
    origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(empresas.router)
app.include_router(clientes.router)
app.include_router(lecturas.router)
app.include_router(tarifas.router)
app.include_router(consumos.router)
app.include_router(reportes.router)
app.include_router(presion.router)
app.include_router(continuidad.router)
app.include_router(reclamos.router)
app.include_router(dashboard.router)
app.include_router(facturas.router)
app.include_router(pagos.router)
app.include_router(configuracion.router)
app.include_router(lectura_matriz.router)
app.include_router(cajas.router)
app.include_router(caf.router)

@app.get("/")
def read_root():
    return {"mensaje": "API de APR funcionando correctamente"}