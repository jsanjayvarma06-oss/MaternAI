from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.analysis import router as analysis_router
from backend.routes.users import router as users_router
from backend.routes.doctors import router as doctors_router

app = FastAPI(title="MaternaAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)
app.include_router(users_router, prefix="/users")
app.include_router(doctors_router, prefix="/doctors")

@app.get("/health")
def health_check():
    return {"status": "ok"}
