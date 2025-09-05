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


def get_recommendations_dynamic(
    chosen_tasks: list[int],
    tasks_payload: list[dict],
    choice_sequences: list[tuple[list[int], int]],
) -> list[dict]:
    """
    Generate a ranked list of task recommendations:
      • chosen_tasks: list of numeric task IDs the user has completed
      • tasks_payload: list of dicts, each with keys:
            "Task","Skill","Length","type","price","num_questions","duration","topic"
      • choice_sequences: list of (prev_tasks, next_task) for toy training

    Steps:
      1. Convert tasks_payload to a pandas DataFrame.
      2. Train a Random Forest on choice_sequences using that DataFrame.
      3. For each available task (not in chosen_tasks):
         a. Compute model_score = probability that the RF assigns to this task as next.
         b. Compute heuristic scores:
            - length_score: prefer shorter durations (normalized).
            - topic_score: prefer tasks whose topic is not yet seen.
            - price_score: prefer prices near $1.00 (normalized).
         c. Combine with weights: 50% model, 20% length, 20% topic, 10% price.
      4. If no tasks taken (first cycle), sort ascending (lowest combined_score first).
         Else, sort descending (highest combined_score first).
      5. Return a list of recommendation dicts, each containing:
         {"task", "score", "skill", "length", "price", "num_questions", "duration", "topic", "type"}
    """
    # 1. Build DataFrame dynamically from tasks_payload
    tasks_df = pd.DataFrame(tasks_payload)

    # 2. Train the model using toy choice_sequences
    model = train_model(choice_sequences, tasks_df)

    # 3a. Compute feature vector for the current state (chosen_tasks)
    feat = make_features_df(tasks_df, chosen_tasks)
    # 3b. Get probability distribution over classes (task IDs)
    # list of probabilities aligned with model.classes_
    probs = model.predict_proba([feat])[0]

    recs = []
    for idx, row in tasks_df.iterrows():
        task_id = int(row["Task"])
        # Skip tasks that have already been taken
        if task_id in chosen_tasks:
            continue

        # 3c. Retrieve the model's probability for this specific task_id
        try:
            model_score = float(probs[list(model.classes_).index(task_id)])
        except ValueError:
            # If task_id is not in model.classes_ (unlikely if training covers all), score = 0
            model_score = 0.0

        # 3d. Heuristic: prefer shorter durations (<— “length_score”)
        #     Normalize: durations ∈ [5,30], so (duration - 5)/25 ∈ [0,1]
        length_score = 1.0 - (row["duration"] - 5) / 25.0

        # 3e. Heuristic: topic diversity — if this topic not in chosen_tasks topics, score=1
        chosen_topics = [
            tasks_df.loc[tasks_df["Task"] == t, "topic"].values[0]
            for t in chosen_tasks
            if t in tasks_df["Task"].values
        ]
        topic_score = 1.0 if row["topic"] not in chosen_topics else 0.0

        # 3f. Heuristic: prefer prices close to $1.00. Price ∈ roughly [0.4,1.5]
        #     Normalize: |price - 1.0|/1.5 ∈ [0,1], then 1 - that gives preference to price≈1.0
        price_score = 1.0 - abs(row["price"] - 1.0) / 1.5

        # 3g. Combine scores with weights (adjust weights as needed)
        combined_score = (
            0.5 * model_score
            + 0.2 * length_score
            + 0.2 * topic_score
            + 0.1 * price_score
        )

        # 3h. Append to recs list a dict with all necessary info
        recs.append(
            {
                "task": task_id,
                "score": combined_score,
                "skill": int(row["Skill"]),
                "length": int(row["Length"]),
                "price": float(row["price"]),
                "num_questions": int(row["num_questions"]),
                "duration": int(row["duration"]),
                "topic": row["topic"],
                "type": row["type"],
            }
        )

    # 4. If first cycle (no tasks taken), return “inverted” order for “unfairness”
    if len(chosen_tasks) == 0:
        # ascending: low score first
        return sorted(recs, key=lambda x: x["score"])

    # 5. Otherwise, return standard descending order (high score first)
    return sorted(recs, key=lambda x: x["score"], reverse=True)
