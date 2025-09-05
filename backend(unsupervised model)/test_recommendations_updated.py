
import pandas as pd
from unsupervised_rec import get_recommendations_dynamic
import json
import re

def format_price_per_hour(price, duration):
    return (price / duration) * 60  # Convertir a precio por hora

def test_recommendation_system():
    with open("Tasks.ts", "r", encoding="utf-8") as f:
        ts_content = f.read()

    match = re.search(r"=\s*(\[.*\]);", ts_content, re.DOTALL)
    if not match:
        raise ValueError("Could not find task array in advancedTasks.ts")
    array_str = match.group(1)  # just the array [ ... ]

    array_str = re.sub(r"(\w+):", r'"\1":', array_str)
    array_str = array_str.replace("'", '"')
    array_str = re.sub(r",(\s*[}\]])", r"\1", array_str)

    tasks_data = json.loads(array_str)
    tasks_df = pd.DataFrame(tasks_data)
    tasks_df = tasks_df.rename(columns={
        "numId": "Task",
        "numQuestions": "num_questions"
    })

    all_tasks = tasks_df.to_dict(orient="records")

    result = get_recommendations_dynamic(
        chosen_tasks=[18,24],
        tasks_payload=tasks_payload,
        choice_sequences=None
    )

    print("\n=== Tareas Recomendadas (justas) ===")
    for rec in result["recommended"]:
        price_per_hour = format_price_per_hour(rec['price'], rec['duration'])
        print(f"Task {rec['task']}: ${rec['price']:.2f} por {rec['duration']}min (${price_per_hour:.2f}/hora) - Score: {rec['score']:.2f} - Tema: {rec['topic']}")

    print("\n=== Tareas Bloqueadas (injustas) ===")
    for rec in result["blocked"]:
        price_per_hour = format_price_per_hour(rec['price'], rec['duration'])
        print(f"Task {rec['task']}: ${rec['price']:.2f} por {rec['duration']}min (${price_per_hour:.2f}/hora) - Razón: Precio por hora bajo")


if __name__ == "__main__":
    test_recommendation_system()
