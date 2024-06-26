import React, { useState } from 'react';

const App = () => {
  const [project, setProject] = useState('');
  const [details, setDetails] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log('Submitting form...');
      
      const response = await fetch('http://localhost:5001/response/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project, details }),
      });

      console.log('Response received:', response);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      console.log('Data received:', data);
      setSubtasks(data.subtasks);
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while fetching data.');
    }
  };

  const handleGetRequest = async () => {
    try {
      console.log('Sending GET request...');
      
      const response = await fetch('http://localhost:5001/response/');
      console.log('Response received:', response);

      const data = await response.json();
      console.log('Data received:', data); // Handle the data as needed
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while fetching data.');
    }
  };

  return (
    <div>
      <h1>Scheduler Assistant</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="project">Project:</label>
        <input
          type="text"
          id="project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        />
        <label htmlFor="details">Details:</label>
        <input
          type="text"
          id="details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
      <button onClick={handleGetRequest}>Fetch Data</button>
      {subtasks.length > 0 && (
        <div>
          <h2>Subtasks:</h2>
          <ul>
            {subtasks.map((subtask, index) => (
              <li key={index}>{subtask}</li>
            ))}
          </ul>
        </div>
      )}
      {error && <p>{error}</p>}
    </div>
  );
};

export default App;
