# Task Recommendation API

This is a task recommendation API built with FastAPI. The API uses a machine learning model to recommend tasks based on the user's history of completed tasks.

## Features

- **Personalized Recommendations**: Based on the user's task history.
- **Fairness Rating**: Classifies tasks as fair or unfair based on predefined criteria.
- **RESTful API**: Easy to integrate with any frontend or mobile app.

## Requirements

- Python 3.10
- pip

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

2. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

1. Start the development server:

```bash
uvicorn main:app --reload
```

2. Open your browser and go to `http://localhost:8000/docs` to view the interactive API documentation.

## Endpoints

- `GET /`: Welcome page.
- `GET /api/recommend`: Gets information about how to use the recommendations endpoint.
- `POST /api/recommend`: Receives task data and returns recommendations.

## Request Example

```bash
curl -X 'POST' \
'http://localhost:8000/api/recommend' \
-H 'accept: application/json' \
-H 'Content-Type: application/json' \
-d '{
"taken_tasks": [1, 2, 3],
"tasks_payload": [
{
"Task": 1,
"Skill": 1,
"Length": 1,
"type": "transcription",
"price": 10.5,
"num_questions": 5,
"duration": 30,
"topic": "technology"
}
]
}'
```

## Deploying to Render

Follow these steps to deploy the application to Render:

1. Create an account on [Render](https://render.com/)
2. Connect your repository GitHub
3. Create a new web service
4. Configure the service with the following parameters:

- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 10000`
- **Port**: 10000

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
