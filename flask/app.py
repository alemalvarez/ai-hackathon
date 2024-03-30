from flask import Flask, render_template, request
from openai import OpenAI
import os

app = Flask(__name__)
api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError('Your API is not detected in your environment vars. Double check.')

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        project = request.form['project']
        details = request.form['details']

        instructions = """ You are a scheduler assistant for breaking complex tasks into actionable chunks. Your goal is to provide a list of small actions that build up to the project chosen by the user. """

        prompt = f""" You will break down this task: {project} into 10 small subtasks, with the following considerations: {details} """

        client = OpenAI(organization="org-R588VtVPiLayZlPfc2F0DyAI")
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

        return render_template('index.html', subtasks=subtasks)
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)