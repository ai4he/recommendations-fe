import json
#from rec import make_features_df, train_model, get_recommendations_dynamic
from unsupervised_rec import get_recommendations_dynamic
import pandas as pd


def format_price_per_hour(price, duration):
    return (price / duration) * 60  # Convertir a precio por hora

def test_recommendation_system():
    # Sample task data
    tasks_payload = [
        {"Task": 1, "Skill": 1, "Length": 5, "type": "short", "price": 0.8,
         "num_questions": 1, "duration": 5, "topic": "math"},  # $9.60/hora
        {"Task": 2, "Skill": 2, "Length": 10, "type": "medium", "price": 1.0,
         "num_questions": 2, "duration": 10, "topic": "english"},  # $6.00/hora
        {"Task": 3, "Skill": 3, "Length": 15, "type": "long", "price": 5.0,
         "num_questions": 3, "duration": 15, "topic": "science"},  # $20.00/hora
        {"Task": 4, "Skill": 1, "Length": 5, "type": "short", "price": 0.5,
         "num_questions": 1, "duration": 5, "topic": "math"},  # $6.00/hora
        {"Task": 5, "Skill": 2, "Length": 10, "type": "medium", "price": 0.3,
         "num_questions": 2, "duration": 10, "topic": "english"},  # $1.80/hora (injusto)
    ]

    # Sample choice sequences for training
    choice_sequences = [
        ([1], 2),  # After task 1, user chose task 2
        ([2], 3),  # After task 2, user chose task 3
        ([1, 2], 4)  # After tasks 1 and 2, user chose task 4
    ]

    print("\n=== Testing First Cycle (No Tasks Taken) ===")
    result = get_recommendations_dynamic(
        chosen_tasks=[],
        tasks_payload=tasks_payload,
        choice_sequences=choice_sequences
    )
    
    print("\n=== Tareas Recomendadas (justas) ===")
    for rec in result['recommended']:
        price_per_hour = format_price_per_hour(rec['price'], rec['duration'])
        print(f"Task {rec['task']}: ${rec['price']:.2f} por {rec['duration']}min (${price_per_hour:.2f}/hora) - Score: {rec['score']:.2f} - Tema: {rec['topic']}")
    
    print("\n=== Tareas Bloqueadas (injustas) ===")
    for rec in result['blocked']:
        price_per_hour = format_price_per_hour(rec['price'], rec['duration'])
        print(f"Task {rec['task']}: ${rec['price']:.2f} por {rec['duration']}min (${price_per_hour:.2f}/hora) - Razón: Precio por hora bajo")

    print("\n=== Testing Second Cycle (With Tasks Taken) ===")
    result = get_recommendations_dynamic(
        chosen_tasks=[1, 2],
        tasks_payload=tasks_payload,
        choice_sequences=choice_sequences
    )
    
    print("\n=== Tareas Recomendadas (justas) ===")
    for rec in result['recommended']:
        price_per_hour = format_price_per_hour(rec['price'], rec['duration'])
        print(f"Task {rec['task']}: ${rec['price']:.2f} por {rec['duration']}min (${price_per_hour:.2f}/hora) - Score: {rec['score']:.2f} - Tema: {rec['topic']}")


if __name__ == "__main__":
    test_recommendation_system()
