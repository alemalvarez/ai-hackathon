from flask import Flask, request, jsonify, Response, send_from_directory
from openai import OpenAI
import datetime
import os
app= Flask(__name__, static_folder='build', static_url_path='/')

# Load OpenAI API key from environment variable
# openai_api_key = os.getenv('OPENAI_API_KEY')
# if not openai_api_key:git
#     raise ValueError('Your OpenAI API key is not detected in your environment variables. Please check.')

# Initialize OpenAI client
openai_client = OpenAI(organization="org-R588VtVPiLayZlPfc2F0DyAI")

@app.route('/')
def index():
  return send_from_directory(app.static_folder, 'index.html')

@app.route('/refine/', methods=['POST', 'GET'])
def refine():
    data = request.get_json()

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
            completion = openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": prompt}
                ]
            )
            refined_subtasks.append(completion.choices[0].message.content)

    response_data = {
        'details': details,
        'project': project,
        'subtasks': refined_subtasks
    }

    return jsonify(response_data), 200

@app.route('/response/', methods=['POST'])
def action():
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

    context = {
        'project': project,
        'details': details,
        'subtasks': subtasks
    }

    return jsonify(context), 200

@app.route('/save_to_ical/', methods=['POST'])
def save_to_ical():
    try:
        data = request.get_json()
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

        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run()
