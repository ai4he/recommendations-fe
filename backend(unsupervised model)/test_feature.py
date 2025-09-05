import json
import re
import pandas as pd
from recom_feature import get_recommendations_dynamic

def format_price_per_hour(price, duration):
    return (price / duration) * 60  # Convertir a precio por hora

def test_recommendation_system():
    # Step 1: Load the TypeScript file
    with open("advancedTasks.ts", "r", encoding="utf-8") as f:
        ts_content = f.read()

    # Step 2: Extract only the array part after '='
    match = re.search(r"=\s*(\[.*\]);", ts_content, re.DOTALL)
    if not match:
        raise ValueError("Could not find task array in advancedTasks.ts")
    array_str = match.group(1)

    # Step 3: Preprocess to JSON
    array_str = re.sub(r"(\w+):", r'"\1":', array_str)
    array_str = array_str.replace("'", '"')
    array_str = re.sub(r",(\s*[}\]])", r"\1", array_str)

    # Step 4: Load as JSON
    tasks_data = json.loads(array_str)

    # Step 5: Map to recommender’s expected schema
    tasks_df = pd.DataFrame(tasks_data)
    tasks_df = tasks_df.rename(columns={
        "numId": "Task",
        "numQuestions": "num_questions"
    })

    if "Skill" not in tasks_df.columns:
        tasks_df["Skill"] = 1
    if "Length" not in tasks_df.columns:
        tasks_df["Length"] = tasks_df["duration"]

    tasks_payload = tasks_df.to_dict(orient="records")

    # Step 6: Run recommender
    result = get_recommendations_dynamic(
        chosen_tasks=[18,24],
        tasks_payload=tasks_payload,
        choice_sequences=None
    )

    print("\n=== Tareas Recomendadas (justas) ===")
    for rec in result["recommended"]:
        price_per_hour = format_price_per_hour(rec['price'], rec['duration'])
        print(f"Task {rec['task']}: ${rec['price']:.2f} por {rec['duration']}min (${price_per_hour:.2f}/hora) - Score: {rec['score']:.2f} - Top feature: {rec['top_feature']} - Tema: {rec['topic']}")

    print("\n=== Tareas Bloqueadas (injustas) ===")
    for rec in result["blocked"]:
        price_per_hour = format_price_per_hour(rec['price'], rec['duration'])
        print(f"Task {rec['task']}: ${rec['price']:.2f} por {rec['duration']}min (${price_per_hour:.2f}/hora) - Razón: Precio por hora bajo")


if __name__ == "__main__":
    test_recommendation_system()
