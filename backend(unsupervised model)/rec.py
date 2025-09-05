# rec.py

import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# ──────────────────────────────────────────────────────────────────────────────
# This module defines functions to train a simple Random Forest model and
# generate task recommendations based on a dynamic list of tasks and a list
# of previously taken tasks. Instead of using a hard-coded DataFrame, we accept
# a payload of tasks from the frontend, build a DataFrame, train the model, then
# compute a combined score for each available task. If no tasks have been taken,
# we deliberately reverse the order (low score first) to “introduce unfairness”;
# otherwise, we return high-score tasks first.
# ──────────────────────────────────────────────────────────────────────────────


def make_features_df(tasks_df: pd.DataFrame, prev_tasks: list[int]) -> list[float]:
    """
    Build a feature vector summarizing the current state of 'prev_tasks' using the
    provided tasks_df. The features include:
      1. avg_skill:    Mean of the 'Skill' column for tasks in prev_tasks.
      2. avg_length:   Mean of the 'Length' column for tasks in prev_tasks.
      3. avg_price:    Mean of the 'price' column for tasks in prev_tasks.
      4. avg_questions: Mean of the 'num_questions' column for tasks in prev_tasks.
      5. avg_duration: Mean of the 'duration' column for tasks in prev_tasks.
      6. count_skill_1, count_skill_2, count_skill_3: Counts of tasks with Skill == 1,2,3.
      7. count_q1, count_q2, count_q3_plus: Counts of tasks with num_questions ==1, ==2, >=3.
      8. count_d10, count_d20, count_d30: Counts of tasks with duration ≤10, 11–20, >20.
      9. topic_counts: For each unique topic in tasks_df, count how many prev_tasks had that topic.
    Returns the features as a list of floats/ints in a fixed order.
    """
    # Filter the DataFrame to only include rows where "Task" is in prev_tasks
    df = tasks_df[tasks_df["Task"].isin(prev_tasks)]
    # 1. Compute average of 'Skill' for previously taken tasks (0 if none)
    avg_skill = df["Skill"].mean() if not df.empty else 0
    # 2. Compute average of 'Length' (0 if none)
    avg_length = df["Length"].mean() if not df.empty else 0
    # 3. Compute average of 'price' (0 if none)
    avg_price = df["price"].mean() if not df.empty else 0
    # 4. Compute average of 'num_questions' (0 if none)
    avg_num_questions = df["num_questions"].mean() if not df.empty else 0
    # 5. Compute average of 'duration' (0 if none)
    avg_duration = df["duration"].mean() if not df.empty else 0

    # 6. Count how many of prev_tasks have Skill == 1,2,3
    count_skill_1 = int((df["Skill"] == 1).sum())
    count_skill_2 = int((df["Skill"] == 2).sum())
    count_skill_3 = int((df["Skill"] == 3).sum())

    # 7. Count tasks by number of questions: ==1, ==2, >=3
    count_q1 = int((df["num_questions"] == 1).sum())
    count_q2 = int((df["num_questions"] == 2).sum())
    count_q3_plus = int((df["num_questions"] >= 3).sum())

    # 8. Count tasks by duration bins: ≤10, 11–20, >20
    count_d10 = int((df["duration"] <= 10).sum())
    count_d20 = int(((df["duration"] > 10) & (df["duration"] <= 20)).sum())
    count_d30 = int((df["duration"] > 20).sum())

    # 9. Count tasks by topic. We first get all unique topics in tasks_df,
    #    then count how many prev_tasks match each topic.
    topics = tasks_df["topic"].unique().tolist()
    topic_counts = [int((df["topic"] == t).sum()) for t in topics]

    # Combine all numeric features into a single list in a fixed order
    features = [
        avg_skill,
        avg_length,
        avg_price,
        avg_num_questions,
        avg_duration,
        count_skill_1,
        count_skill_2,
        count_skill_3,
        count_q1,
        count_q2,
        count_q3_plus,
        count_d10,
        count_d20,
        count_d30,
    ]
    # Extend the list with topic counts (one count per unique topic)
    features.extend(topic_counts)
    return features


def train_model(choice_sequences: list[tuple[list[int], int]], tasks_df: pd.DataFrame):
    """
    Train a RandomForestClassifier on the toy choice_sequences. Each element of
    choice_sequences is a tuple: (previously_taken_tasks, next_task_id).
    1. Build X_train by calling make_features_df(prev_tasks) for each sequence.
    2. Build y_train by collecting the next_task_id.
    3. Fit a RandomForestClassifier on X_train, y_train.
    Returns the trained model.
    """
    X_train = []
    y_train = []
    # Loop through each example sequence
    for prev, nxt in choice_sequences:
        X_train.append(make_features_df(tasks_df, prev))
        y_train.append(nxt)

    # Create and train a Random Forest with 100 trees, fixed random_state for reproducibility
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    return model


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

def get_recommendations_dynamic(
    chosen_tasks: list[int],
    tasks_payload: list[dict],
    choice_sequences: list[tuple[list[int], int]],
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
    tasks_df = pd.DataFrame(tasks_payload)
    
    # 2. Train the model using toy choice_sequences
    model = train_model(choice_sequences, tasks_df)
    
    # 3. Compute feature vector for the current state (chosen_tasks)
    feat = make_features_df(tasks_df, chosen_tasks)
    probs = model.predict_proba([feat])[0] if len(chosen_tasks) > 0 else None
    
    def create_task_dict(row):
        """Helper function to create a task dictionary."""
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
        
        # Calculate model score if we have a model
        if probs is not None and hasattr(model, 'classes_'):
            try:
                task_dict["model_score"] = float(probs[list(model.classes_).index(task_dict["task"])])
            except (ValueError, AttributeError):
                task_dict["model_score"] = 0.0
        else:
            task_dict["model_score"] = 0.0
            
        return task_dict
    
    # 4. Categorize all tasks
    fair_tasks = []
    unfair_tasks = []
    
    for idx, row in tasks_df.iterrows():
        task_id = int(row["Task"])
        if task_id in chosen_tasks:
            continue
            
        task_dict = create_task_dict(row)
        
        # Categorize task
        if task_dict["is_fair"]:
            fair_tasks.append(task_dict)
        else:
            unfair_tasks.append(task_dict)
    
    # 5. Calculate scores for fair tasks
    fair_tasks = [calculate_scores(task, tasks_df, chosen_tasks) for task in fair_tasks]
    
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


# tareas no justas:
# $2usd la hora no es justa
# >10 es actractiva
# Mostrar recomendados y no recomendados (bloqueados)