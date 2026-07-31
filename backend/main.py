from fastapi import FastAPI
from app.core.database import engine, Base
from app.api import clientes, lecturas, tarifas, consumos, reportes,presion, continuidad, reclamos

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


Base.metadata.create_all(bind=engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(clientes.router)
app.include_router(lecturas.router)
app.include_router(tarifas.router)
app.include_router(consumos.router)
app.include_router(reportes.router)
app.include_router(presion.router)
app.include_router(continuidad.router)
app.include_router(reclamos.router)

@app.get("/")
def read_root():
    return {"mensaje": "API de APR funcionando correctamente"}