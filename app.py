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
    CORS(app, origins=os.getenv('CORS_ORIGIN'))


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
    subtasks = data.get('subtasks', [])
    status = data.get('status', [])

    instructions = f"""Based on your previous task that you broke for me for project: {project}, with details {details}.
    I want you to fix some specific tasks that I am providing you. fix only this specific task and change nothing else.
    """

    refined_subtasks = []
    for subtask, task_status in zip(subtasks, status):
        if task_status == 'keep':
            refined_subtasks.append(subtask)
            continue
        elif task_status == 'remove':
            continue  # Skip this subtask
        else:
            prompt = f"This subtask needs work: \"{subtask}\". This is what I feel about it: {task_status}. fix it."
            logging.info('Sending completion request to OpenAI API')
            # completion = openai_client.chat.completions.create(
            #     model="gpt-3.5-turbo",
            #     messages=[
            #         {"role": "system", "content": instructions},
            #         {"role": "user", "content": prompt}
            #     ]
            # )
            
            logging.debug(f'Received response from OpenAI API: {completion.choices[0].message.content}')
            refined_subtasks.append(completion.choices[0].message.content)

    response_data = {
        'details': details,
        'project': project,
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