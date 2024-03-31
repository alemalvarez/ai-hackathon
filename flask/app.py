from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
CORS(app)

# Load OpenAI API key from environment variable
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError('Your OpenAI API key is not detected in your environment variables. Please check.')

# Initialize OpenAI client
openai_client = OpenAI(organization="org-R588VtVPiLayZlPfc2F0DyAI")

@app.route('/refine/', methods=['POST'])
def refine():
    subtask = request.get_json()['subtask']

    instructions = """You are a scheduler assistant for breaking complex tasks into actionable chunks. Your goal is to provide a list of small actions that build up to the project chosen by the user."""
    prompt = f"This task is too complex: {subtask}. Further split it into three smaller tasks."

    completion = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt}
        ]
    )
    response = completion.choices[0].message.content

    # Parse response into a list of subtasks
    lines = response.strip().split('\n')
    subtasks = [line.split('. ', 1)[1] for line in lines if line.startswith(tuple(f"{i}. " for i in range(1, 11)))]

    response_headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',  # Update with your React frontend URL
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }

    context = {
        'subtasks': subtasks
    }

    print(context)
    return jsonify(context), 200, response_headers

@app.route('/response/', methods=['POST'])
def index():
    data = request.get_json()

    project = data['project']
    details = data['details']

    # Prepare prompt for OpenAI completion
    instructions = """You are a scheduler assistant for breaking complex tasks into actionable chunks. Your goal is to provide a list of small actions that build up to the project chosen by the user."""
    prompt = f"You will break down this task: {project} into 10 small subtasks, with the following considerations: {details}"

    # Request completion from OpenAI API
    completion = openai_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt}
        ]
    )
    response = completion.choices[0].message.content

    # Parse response into a list of subtasks
    lines = response.strip().split('\n')
    subtasks = [line.split('. ', 1)[1] for line in lines if line.startswith(tuple(f"{i}. " for i in range(1, 11)))]

    # Set CORS headers
    response_headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000',  # Update with your React frontend URL
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, PATCH, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }

    context = {
        'project': project,
        'details': details,
        'subtasks': subtasks
    }

    return jsonify(context), 200, response_headers

if __name__ == '__main__':
    app.run(debug=True, port=5001)
