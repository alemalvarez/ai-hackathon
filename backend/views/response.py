from flask import *
from openai import OpenAI
import os

@app.route('/response', methods=['POST', 'GET'])
def response():
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError('Your API is not detected in your environment vars. Double check.')

    # Prompt the user for the project and details
    project = input("What's the task that needs to be broken down? ")
    details = input("What are some specifics? ")

    instructions = """ You are a scheduler assistant for breaking complex tasks into actionable chunks. Your goal is to provide a list of small actions that build up to the project chosen by the user. """

    prompt = f""" You will break down this task: {project} into 10 small subtasks, with the following considerations: {details} """

    client = OpenAI()
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": instructions},
            {"role": "user", "content": prompt}
        ]
    )
    return jsonify({"response": completion.choices[0].message.content})