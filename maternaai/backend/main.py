from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes.analysis import router as analysis_router
from backend.routes.users import router as users_router
from backend.routes.doctors import router as doctors_router
from backend.routes.wellbeing import router as wellbeing_router
from backend.routes.ppd import router as ppd_router

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
app.include_router(wellbeing_router)
app.include_router(ppd_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
