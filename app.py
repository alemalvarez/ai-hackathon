import logging
from flask import Flask, request, jsonify, Response, send_from_directory
from flask_cors import CORS
import anthropic
import datetime
import os
from dotenv import load_dotenv
import json

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__, static_folder='build', static_url_path='/')
# This code breaks in Azure

# Load OpenAI API key from environment variable
# openai_api_key = os.getenv('OPENAI_API_KEY')
# if not openai_api_key:
#     raise ValueError('Your OpenAI API key is not detected in your environment variables. Please check.')

anthropic_client = anthropic.Anthropic()


# Check if running in development environment
is_dev = os.getenv('FLASK_ENV') == 'development'

# CORS configuration ONLY running on dev. This won't run on prod.
if is_dev:
    logging.info("WARNING: CORS enabled. Hope you're not in production ;)")
    from flask_cors import CORS
    CORS(app)


@app.route('/')
def index():
    logging.info('Received request for index route')
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/refine/', methods=['POST', 'GET'])
def refine():
    logging.info('Received request for /refine route')
    data = request.get_json()
    logging.debug(f'Received data: {data}')

    details = data.get('details', '')
    project = data.get('project', '')
    subtask = data.get('subtask', '')
    feedback = data.get('feedback', '')

    instructions = """You are a scheduler assistant for breaking complex tasks into actionable chunks. Your goal is to provide a list of small actions that build up to the project chosen by the user.
    You will return the chunks as elements on a JSON list, like ['subtask1', 'subtask2', 'subtask3',...].
    If later you are asked to break down a subtask into multiple subtasks, you will also return a JSON file, like ['subtask1.1', 'subtask1.2]. Don't numerate them.
    If later you are asked to refine a task, you will return a JSON array with one single entry containing the refined subtask, like ['better_subtask1']. the maximum length of subtasks should be 3.
    """

    prompt = f"""You generated this subtask: {subtask} as part of my complex task {project} with these details {details}.
    I think that it needs some refinement: {feedback}.
    """

    logging.info('Sending completion request to Anthropic API')
    completion = anthropic_client.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=1000,
        temperature=0.0,
        system=instructions,
        messages=[
            {"role": "user", "content": prompt},
            {"role": "assistant", "content": "["}
        ]
    )
    refined_subtask = completion.content[0].text
    logging.debug(f'Received response from Anthropic API: {refined_subtask}')

    # Splitting the generated subtasks into chunks of maximum length 3
    refined_subtasks = [refined_subtask[i:i + 3] for i in range(0, len(refined_subtask), 3)]

    response = json.dumps(refined_subtasks)

    logging.info(f"\n{response}\n")

    response_data = {
        'details': details,
        'project': project,
        'subtask': subtask,
        'subtasks': refined_subtasks
    }
    logging.info('Returning response with refined subtasks')
    return jsonify(response_data), 200
@app.route('/response/', methods=['POST'])
def action():
    logging.info('Received POST request for /response route')
    data = request.get_json()
    logging.debug(f'Received data: {data}')

    project = data['project']
    details = data['details']

    # Prepare prompt for OpenAI completion
    instructions = """You are a scheduler assistant for breaking complex tasks into actionable chunks. Your goal is to provide a list of small actions that build up to the project chosen by the user.
    You will return the chunks as elements on a JSON list, like ['subtask 1', 'subtask 2', 'subtask 3',...]"""
    prompt = f"You will break down this task: {project} into 10 small subtasks, with the following considerations: {details}"

    # Request completion from OpenAI API
    logging.info('Sending completion request to Anthropic')
    message = anthropic_client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=1000,
        temperature=0.0,
        system=instructions,
        messages=[
            {"role": "user", "content": prompt},
            {"role": "assistant", "content":"["}
        ]
    )

    logging.debug(f'Received response from Anthropic API: {message.content}')

    response = message.content[0].text
    response = f"[{response}"
    logging.info(f"\n{response}\n")
    # Parse the JSON string
    subtasks = json.loads(response)
    context = {
        'project': project,
        'details': details,
        'subtasks': subtasks
    }

    logging.info('Returning response with subtasks')
    return jsonify(context), 200

@app.route('/save_to_ical/', methods=['POST'])
def save_to_ical():
    try:
        logging.info('Received POST request for /save_to_ical route')
        data = request.get_json()
        logging.debug(f'Received data: {data}')
        project = data['project']
        details = data['details']
        subtasks = data['subtasks']

        ical_content = f"BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Calendar//EN\n"

        # Add project event
        ical_content += f"BEGIN:VEVENT\n"
        ical_content += f"SUMMARY:{project}\n"
        ical_content += f"DESCRIPTION:{details}\n"
        ical_content += f"DTSTART:{datetime.datetime.now().strftime('%Y%m%dT%H%M%S')}\n"
        ical_content += f"DTEND:{datetime.datetime.now().strftime('%Y%m%dT%H%M%S')}\n"
        ical_content += f"END:VEVENT\n"

        # Add subtasks as separate events
        for subtask in subtasks:
            ical_content += f"BEGIN:VEVENT\n"
            ical_content += f"SUMMARY:{subtask}\n"
            ical_content += f"DTSTART:{datetime.datetime.now().strftime('%Y%m%dT%H%M%S')}\n"
            ical_content += f"DTEND:{datetime.datetime.now().strftime('%Y%m%dT%H%M%S')}\n"
            ical_content += f"END:VEVENT\n"

        ical_content += "END:VCALENDAR"

        # Create a response with the iCal content
        response = Response(ical_content, mimetype='text/calendar')
        response.headers.set('Content-Disposition', 'attachment', filename='tasks.ics')

        logging.info('Returning iCal file response')
        return response
    except Exception as e:
        logging.error(f'Error occurred: {e}')
        return jsonify({'error': str(e)}), 500

# This only runs if called with 'python3 app.py'. Port has to be passed to flask by CLI parameter.
if __name__ == '__main__':
    app.run(debug=True, port=5001)