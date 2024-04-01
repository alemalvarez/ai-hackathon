import React, { useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import './Animations.css';

// LoginPage Component (Based off template)
function LoginPage() {
  // Using Auth0 hooks for authentication
  const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();

  if (isAuthenticated) {
      return (
          <div>
              <img src={user.picture} alt={user.name} />
              <h2>{user.name}</h2>
              <button onClick={() => logout({ returnTo: window.location.origin })}>
                  Log Out
              </button>
          </div>
      );
  } else {
      return (
          <button onClick={loginWithRedirect}>Log In</button>
      );
  }
}

function App() {
  // Frontend States
  const [showMainPage, setShowMainPage] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [outputData, setOutputData] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Backend States
  const [project, setProject] = useState('');
  const [details, setDetails] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [error, setError] = useState('');

  //todo Keys (Place in .env files later for security)
  const domain = "dev-igx0eff32n6l7436.us.auth0.com"; 
  const clientId = "l9uS8Pp86tE0Oy3G75wNgvfIOUXxhCyh";

  // Backend Function: Handle what happens when a user submits their input.
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form...');

    try {
      console.log('Sending POST request to /response');
      const response = await fetch('/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project, details }),
      });

      console.log('Response received:', response);

      if (!response.ok) {
        console.error('Network response was not ok');
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

  // Backend Function: Handle what happens when a user clicks the Get Started button.
  const handleGetRequest = async () => {
    try {
      console.log('Sending GET request to /response');
      const response = await fetch('/response');
      console.log('Response received:', response);

      const data = await response.json();
      console.log('Data received:', data); // Handle the data as needed
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while fetching data.');
    }
  };

  // Function: Handle what happens when a user submits their input.
  const handleInputSubmit = () => {
    console.log('Handling input submit');
    setOutputData(['Output 1', 'Output 2', 'Output 3']); // Pretend processing
  };

  // Function: Handle what happens when a user clicks the Get Started button.
  const handleGetStartedClick = () => {
    console.log('Handling Get Started click');
    setIsAnimating(true); // Start the animation
    setTimeout(() => {
      setShowMainPage(true); // Switch to the main page after the animation ends
      setIsAnimating(false); // Reset animation state
    }, 420); // Match the CSS animation duration
  };

  // Function: Listen for the Enter key press to submit the input.
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      console.log('Enter key pressed');
      handleInputSubmit();
    }
  };

  // Main Render
  return (
    <Auth0Provider domain={domain} clientId={clientId} redirectUri={window.location.origin}>
    <div className="app-background">
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Chunkify.ai</h1>
        </header>
        {/* Landing Page */}
        {!showMainPage ? (
          <div className={`landing-page-wrapper ${isAnimating ? 'slide-out-right-fade-out' : ''}`}>
            <h2 className="app-slogan">Where tasks meet their match. One chunk at a time.</h2>
            <button className="get-started-button" onClick={handleGetStartedClick}>Get Started</button>
          </div>
        ) : (
          // Main page content
          <div className={`main-page-wrapper animated ${showMainPage && !isAnimating ? 'slide-in-right-fade-in' : ''}`}>
            <form onSubmit={handleSubmit}>
              {/*<!-- Project --> */} 
              <label htmlFor="project">Project:</label>
              <input
                type="text"
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="What you want to do" 
                onKeyPress={handleKeyPress}
              />
              {/*<!-- Details --> */} 
              <label htmlFor="details">Details:</label>
              <input
                type="text"
                id="details"
                value={details}
                placeholder="Additional details"
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
        )}
      </div>
      <LoginPage />
    </div>
    </Auth0Provider>
  );
}

export default App;