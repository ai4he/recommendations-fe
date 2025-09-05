# main.py
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal, Dict, Any
from rec import get_recommendations_dynamic

from unsupervised_rec import get_recommendations_unsup_dynamic
from recom_feature import get_recommendations_with_top_feat_dynamic

import json
import re




# Create a FastAPI instance
app = FastAPI()

# ──────────────────────────────────────────────────────────────────────────────
# 1. CORS (Cross-Origin Resource Sharing) Configuration
#
#    We need to allow our frontend (running, for example, on http://localhost:3000)
#    to make requests to this backend. Without this, the browser will block the request.
#    The middleware below permits:
#      • allow_origins: which origins (domains) can call this API
#      • allow_methods: which HTTP methods are permitted (GET, POST, etc.)
#      • allow_headers: which headers are allowed in the request
#      • allow_credentials: whether to allow cookies or credentials
# ──────────────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos HTTP
    allow_headers=["*"],  # Permitir todas las cabeceras
)

# ──────────────────────────────────────────────────────────────────────────────
# 2. Pydantic Models for Request and Response
#
#    We define two Pydantic schemas:
#
#    2.1 TaskItem: Describes the shape of each task object that the frontend will send.
#         Fields must exactly match the keys in tasks_payload from the frontend.
#
#    2.2 RecommendRequest: Describes the shape of the POST request body.
#         It includes:
#           • taken_tasks: List[int]  => the numeric IDs of tasks the user has completed.
#           • tasks_payload: List[TaskItem] => the full list of all tasks (with all attributes),
#             so the backend can build a DataFrame dynamically and run the model.
#
#    2.3 RecommendItem: Describes the shape of each recommendation the API returns.
#         It includes the task ID, score, and all metadata fields that the frontend will use
#         to display recommendation details (price, duration, topic, etc.).
# ──────────────────────────────────────────────────────────────────────────────


class TaskItem(BaseModel):
    Task: int
    Skill: int
    Length: int
    # We use Literal[...] to restrict allowed string values for `type`
    type: Literal[
        "transcription",
        "image_labeling",
        "text_labeling",
        "voice_recording",
        "video_recording",
        "survey_response",
    ]
    price: float
    num_questions: int
    duration: int
    topic: str


class RecommendRequest(BaseModel):
    taken_tasks: List[int]        # e.g. [1, 4, 7]
    # e.g. list of TaskItem objects representing all tasks
    tasks_payload: List[TaskItem]
    user_skills: List[str] | None = None  # Optional field



class RecommendItem(BaseModel):
    task: int
    score: float
    skill: int
    length: int
    price: float
    num_questions: int
    duration: int
    topic: str
    type: str
    top_feature: str | None = None     


# ──────────────────────────────────────────────────────────────────────────────
# 3. Main Endpoint: /api/recommend
#
#    This endpoint receives a POST with JSON body matching RecommendRequest.
#    It then:
#      1. Builds choice_sequences (toy example). In a real implementation, you would
#         load historical user behavior from a database or external source.
#      2. Calls get_recommendations_dynamic(), passing:
#           • chosen_tasks: list of numeric Task IDs already taken
#           • tasks_payload: list of all tasks with metadata
#           • choice_sequences: training sequences for the toy model
#      3. Returns the list of recommendations as a JSON array of RecommendItem objects,
#         already sorted by combined_score (ascending if no tasks taken, descending otherwise).
# ──────────────────────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {"message": "Bienvenido a la API de recomendación de tareas. Usa /api/recommend para obtener recomendaciones."}

@app.get("/api/recommend")
async def get_recommendation():
    return {"message": "Usa el método POST con los datos de las tareas para obtener recomendaciones"}

@app.post("/api/recommend", response_model=List[RecommendItem])
async def recommend(req: RecommendRequest) -> List[RecommendItem]:
    """
    Receives:
      - req.taken_tasks: list of numeric task IDs the user has completed
      - req.tasks_payload: list of TaskItem objects (the full catalog of tasks)

    Returns:
      - A list of RecommendItem objects, each containing:
          • task (numId)
          • score (combined AI + heuristic)
          • skill, length, price, num_questions, duration, topic, type

    The function trains (toy-example) a RandomForest based on predefined choice_sequences.
    """
    # Asegurarse de que los datos de entrada son correctos
    if not req.tasks_payload:
        raise HTTPException(status_code=400, detail="No se proporcionaron tareas para analizar")

    try:
        # 3.1. Example training sequences for the toy model.
        #      (In production, replace this with real historical data or a larger dataset.)
        choice_sequences = [
            ([1, 2], 3),
            ([1, 3], 2),
            ([2, 1], 3),
            ([2, 3], 1),
            ([3, 1], 2),
            ([3, 2], 1),
        ]

        # Convertir los objetos TaskItem a diccionarios
        tasks_data = [task.dict() for task in req.tasks_payload]
        
        # Crear el DataFrame
        tasks_df = pd.DataFrame(tasks_data)

        # Obtener recomendaciones
        recs = get_recommendations_dynamic(
            chosen_tasks=req.taken_tasks,
            tasks_payload=tasks_df,
            choice_sequences=choice_sequences,
        )
        
        # Procesar las recomendaciones
        result = []
        
        # Verificar si hay recomendaciones
        if isinstance(recs, dict) and "recommended" in recs and isinstance(recs["recommended"], list):
            for item in recs["recommended"]:
                try:
                    # Crear un objeto RecommendItem para cada recomendación
                    result.append(RecommendItem(
                        task=item.get("task", 0),
                        score=item.get("score", 0.0),
                        skill=item.get("skill", 0),
                        length=item.get("length", 0),
                        price=item.get("price", 0.0),
                        num_questions=item.get("num_questions", 0),
                        duration=item.get("duration", 0),
                        topic=item.get("topic", ""),
                        type=item.get("type", ""),
                    ))
                except Exception as e:
                    print(f"Error al mapear el ítem: {item}", e)
                    continue
        
        return result
        
    except Exception as e:
        # Registrar el error para depuración
        print(f"Error en el endpoint /api/recommend: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar la solicitud: {str(e)}"
        )



#new endpoint with unsupervised model
@app.post("/api/recommend_unsupervised", response_model=List[RecommendItem])
async def recommend_unsupervised(req: RecommendRequest) -> List[RecommendItem]:
    """
    Receives:
      - req.taken_tasks: list of numeric task IDs the user has completed
      - req.tasks_payload: list of TaskItem objects (the full catalog of tasks)

    Returns:
      - A list of RecommendItem objects, each containing:
          • task (numId)
          • score (combined AI + heuristic)
          • skill, length, price, num_questions, duration, topic, type

    The function trains (toy-example) a RandomForest based on predefined choice_sequences.
    """
    # Asegurarse de que los datos de entrada son correctos
    if not req.tasks_payload:
        raise HTTPException(status_code=400, detail="No se proporcionaron tareas para analizar")

    try:

        with open("tasks.json", "r", encoding="utf-8") as f:
            tasks_data = json.load(f)
        
        tasks_df = pd.DataFrame(tasks_data)
        tasks_df = tasks_df.rename(columns={
            "numId": "Task",
            "numQuestions": "num_questions"
        })
        all_tasks = tasks_df.to_dict(orient="records")
        
        tasks_data = [task.dict() for task in req.tasks_payload]        
        tasks_avail = pd.DataFrame(tasks_data)

        recs = get_recommendations_unsup_dynamic(
            chosen_tasks=req.taken_tasks,
            tasks_payload=tasks_avail,
            choice_sequences=None,
            task_df=all_tasks,
        )
        
        # Procesar las recomendaciones
        result = []
        
        # Verificar si hay recomendaciones
        if isinstance(recs, dict) and "recommended" in recs and isinstance(recs["recommended"], list):
            for item in recs["recommended"]:
                try:
                    # Crear un objeto RecommendItem para cada recomendación
                    result.append(RecommendItem(
                        task=item.get("task", 0),
                        score=item.get("score", 0.0),
                        skill=item.get("skill", 0),
                        length=item.get("length", 0),
                        price=item.get("price", 0.0),
                        num_questions=item.get("num_questions", 0),
                        duration=item.get("duration", 0),
                        topic=item.get("topic", ""),
                        type=item.get("type", ""),
                    ))
                except Exception as e:
                    print(f"Error al mapear el ítem: {item}", e)
                    continue
        
        return result
        
    except Exception as e:
        # Registrar el error para depuración
        print(f"Error en el endpoint /api/recommend: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar la solicitud: {str(e)}"
        )


#new endpoint with top feature and unsupervised model
@app.post("/api/recommend_unsupervised_with_feat", response_model=List[RecommendItem])
async def recommend_unsupervised_with_feat(req: RecommendRequest) -> List[RecommendItem]:

    if not req.tasks_payload:
        raise HTTPException(status_code=400, detail="No se proporcionaron tareas para analizar")

    try:
        with open("tasks.json", "r", encoding="utf-8") as f:
            tasks_data = json.load(f)
        
        tasks_df = pd.DataFrame(tasks_data)
        tasks_df = tasks_df.rename(columns={
            "numId": "Task",
            "numQuestions": "num_questions"
        })
        all_tasks = tasks_df.to_dict(orient="records")
        
        tasks_data = [task.dict() for task in req.tasks_payload]        
        tasks_avail = pd.DataFrame(tasks_data)

        recs = get_recommendations_with_top_feat_dynamic(
            chosen_tasks=req.taken_tasks,
            tasks_payload=tasks_avail,
            choice_sequences=None,
            task_df=all_tasks,
        )
        
        # Procesar las recomendaciones
        result = []
        
        # Verificar si hay recomendaciones
        if isinstance(recs, dict) and "recommended" in recs and isinstance(recs["recommended"], list):
            for item in recs["recommended"]:
                try:
                    # Crear un objeto RecommendItem para cada recomendación
                    result.append(RecommendItem(
                        task=item.get("task", 0),
                        score=item.get("score", 0.0),
                        skill=item.get("skill", 0),
                        length=item.get("length", 0),
                        price=item.get("price", 0.0),
                        num_questions=item.get("num_questions", 0),
                        duration=item.get("duration", 0),
                        topic=item.get("topic", ""),
                        type=item.get("type", ""),
                        top_feature=item.get("top_feature", None),
                    ))
                except Exception as e:
                    print(f"Error al mapear el ítem: {item}", e)
                    continue
        
        return result
        
    except Exception as e:
        # Registrar el error para depuración
        print(f"Error en el endpoint /api/recommend: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error al procesar la solicitud: {str(e)}"
        )
    