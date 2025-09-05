import pandas as pd

from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np


def is_task_fair(task: dict) -> bool:
    """
    Determina si una tarea es justa basado en el precio por hora.
    - $2 USD por hora o menos se considera injusto.
    - Más de $10 se considera atractivo.
    """   
    price_per_hour = task['price'] / (task['duration'] / 60)  # precio por minuto * 60
    return price_per_hour > 2.0  # Más de $2 por hora se considera justo

def calculate_scores(task, tasks_df, chosen_tasks):
    """Calculate additional scores for fair tasks."""
    # Length score: prefer shorter durations
    task["length_score"] = 1.0 - (task["duration"] - 5) / 25.0
    
    # Topic diversity
    chosen_topics = [
        tasks_df.loc[tasks_df["Task"] == t, "topic"].values[0]
        for t in chosen_tasks 
        if t in tasks_df["Task"].values
    ]
    task["topic_score"] = 1.0 if task["topic"] not in chosen_topics else 0.0
    
    # Price score: prefer prices around $10 (more attractive)
    task["price_score"] = min(1.0, task["price"] / 10.0)  # Cap at 1.0 for $10+
    
    # Combined score with adjusted weights
    task["score"] = (
        0.4 * task["model_score"] +  # Less weight on model
        0.2 * task["length_score"] +  # Same weight
        0.2 * task["topic_score"] +   # Same weight
        0.2 * task["price_score"]     # More weight on price
    )
    return task


def top_contributing_feature(user_vec, task_vec, feature_names):
    u = user_vec / np.linalg.norm(user_vec)
    t = task_vec / np.linalg.norm(task_vec)
    contribs = u * t
    top_idx = np.argmax(contribs)
    return feature_names[top_idx], contribs[top_idx]

def get_recommendations_with_top_feat_dynamic(
    chosen_tasks: list[int],
    tasks_payload: list[dict],
    choice_sequences=None, # no training 
    task_df=list[dict], # all tasks data for reference
) -> dict:
    """
    Generate ranked lists of task recommendations, separating fair and unfair tasks.
    
    Args:
        chosen_tasks: List of task IDs the user has completed
        tasks_payload: List of dicts with task details
        choice_sequences: List of (prev_tasks, next_task) for training
        
    Returns:
        A dictionary with:
        - 'recommended': List of recommended fair tasks
        - 'blocked': List of unfair tasks
        - 'all_fair_tasks': All fair tasks (for reference)
        - 'all_unfair_tasks': All unfair tasks (for reference)
    """
    # 1. Build DataFrame dynamically from tasks_payload
    avail_tasks = pd.DataFrame(tasks_payload)
    all_tasks_df = pd.DataFrame(task_df)
    
    # 2. Preprocessing
    numeric_features = ["price", "duration"]
    categorical_features = ["type","topic"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(), categorical_features),
        ]
    )

    X_all = preprocessor.fit_transform(all_tasks_df)
    X_all = X_all.toarray() if not isinstance(X_all, np.ndarray) else X_all

    X_avail = preprocessor.transform(avail_tasks)
    X_avail = X_avail.toarray() if not isinstance(X_avail, np.ndarray) else X_avail


    if chosen_tasks:
        chosen_idx = all_tasks_df[all_tasks_df["Task"].isin(chosen_tasks)].index
        chosen_avg = X_all[chosen_idx].mean(axis=0).reshape(1, -1) 
        similarities = cosine_similarity(chosen_avg, X_avail).flatten()
    else:
        similarities = None
    
    feature_names = preprocessor.get_feature_names_out()

    def create_task_dict(row, idx):
        task_dict = {
            "task": int(row["Task"]),
            "skill": int(row["Skill"]),
            "length": int(row["Length"]),
            "price": float(row["price"]),
            "price_per_hour": (float(row["price"]) / float(row["duration"])) * 60,
            "num_questions": int(row["num_questions"]),
            "duration": int(row["duration"]),
            "topic": row["topic"],
            "type": row["type"],
            "is_fair": is_task_fair(row.to_dict())
        }

        if similarities is not None:
            task_vec = X_avail[idx].flatten()
            top_feat, feat_score = top_contributing_feature(chosen_avg.flatten(), task_vec, feature_names)
            task_dict["model_score"] = float(similarities[idx])
            task_dict["top_feature"] = top_feat
        else:
            task_dict["model_score"] = 0.0
            task_dict["top_feature"] = None
        return task_dict


    # 4. Categorize all tasks
    fair_tasks = []
    unfair_tasks = []

    for idx, row in avail_tasks.iterrows():
        task_id = int(row["Task"])
        if task_id in chosen_tasks:
            continue

        task_dict = create_task_dict(row, idx)
        
        # Categorize task
        if task_dict["is_fair"]:
            fair_tasks.append(task_dict)
        else:
            unfair_tasks.append(task_dict)

    # 5. Calculate scores for fair tasks
    fair_tasks = [calculate_scores(task, avail_tasks, chosen_tasks) for task in fair_tasks]
    
    # 6. Sort fair tasks by score (highest first)
    recommended_tasks = sorted(fair_tasks, key=lambda x: x["score"], reverse=True)

    # 7. For first cycle, show some fair and unfair tasks
    if len(chosen_tasks) == 0:
        return {
            "recommended": recommended_tasks[:3],
            "blocked": sorted(unfair_tasks, key=lambda x: x["price_per_hour"])[:2],
            "all_fair_tasks": fair_tasks,
            "all_unfair_tasks": unfair_tasks
        }

    # 8. For subsequent cycles, only recommend fair tasks
    return {
        "recommended": recommended_tasks,
        "blocked": sorted(unfair_tasks, key=lambda x: x["price_per_hour"], reverse=True),
        "all_fair_tasks": fair_tasks,
        "all_unfair_tasks": unfair_tasks
    }

