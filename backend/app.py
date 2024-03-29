import streamlit as st
from openai import OpenAI
import os

api_key = os.getenv('OPENAI_API_KEY')
if not api_key:
    raise ValueError('Your API is not detected in your environment vars. Double check.')

st.title("Task Breakdown Assistant")

project = st.text_input("What's the task that needs to be broken down?")
details = st.text_area("What are some specifics?")

if 'subtasks' not in st.session_state:
    st.session_state.subtasks = []

if st.button("Break down task"):
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
    response = completion.choices[0].message.content

    # Parse the response into a list of subtasks
    lines = response.strip().split('\n')
    subtasks = [line.split('. ', 1)[1] for line in lines if line.startswith(('1. ', '2. ', '3. ', '4. ', '5. ', '6. ', '7. ', '8. ', '9. ', '10. '))]
    st.session_state.subtasks = subtasks

# Render the subtasks as reorderable and deletable boxes
for i, subtask in enumerate(st.session_state.subtasks):
    with st.container():
        cols = st.columns([1, 10, 1])
        cols[1].markdown(f"**Subtask {i + 1}:** {subtask}")

        with cols[0]:
            move_up = st.button("⬆️", key=f"move_up_{i}")
            if move_up and i > 0:
                st.session_state.subtasks[i], st.session_state.subtasks[i - 1] = st.session_state.subtasks[i - 1], st.session_state.subtasks[i]

        with cols[2]:
            move_down = st.button("⬇️", key=f"move_down_{i}")
            if move_down and i < len(st.session_state.subtasks) - 1:
                st.session_state.subtasks[i], st.session_state.subtasks[i + 1] = st.session_state.subtasks[i + 1], st.session_state.subtasks[i]

        delete = st.button("Delete", key=f"delete_{i}")
        if delete:
            st.session_state.subtasks.pop(i)