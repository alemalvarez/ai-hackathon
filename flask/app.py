from flask import Flask, render_template, request, jsonify

from flask_cors import CORS
from openai import OpenAI
import os

app = Flask(__name__)
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError('Your API is not detected in your environment vars. Double check.')

CORS(app)
@app.route('/response/', methods=['GET', 'POST'])
def index():
    data = request.get_json()

    if not data or 'project' not in data or 'details' not in data:
        return jsonify(error='Invalid JSON data. Project and details are required.'), 400

    project = data['project']
    details = data['details']

    instructions = """You are a scheduler assistant for breaking complex tasks into actionable chunks. Your goal is to provide a list of small actions that build up to the project chosen by the user."""

    prompt = f"""You will break down this task: {project} into 10 small subtasks, with the following considerations: {details}"""

   
    client = OpenAI(organization="org-ocdPJoYXMFQNeH7dv0pV8g0p")
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt}
        ]
    )
    response = completion.choices[0].message.content

    # Parse the response into a list of subtasks
    lines = response.strip().split('\n')
    subtasks = [line.split('. ', 1)[1] for line in lines if line.startswith(('1. ', '2. ', '3. ', '4. ', '5. ', '6. ', '7. ', '8. ', '9. ', '10. '))]

    # Add CORS headers
    response_headers = {
        'Access-Control-Allow-Origin': 'http://localhost:3000/',  # Update with your React frontend URL
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type'
    }

    return jsonify(subtasks=subtasks), 200, response_headers

if __name__ == '__main__':
    app.run(debug=True, port=3000)