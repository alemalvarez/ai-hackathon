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
  // States
  const [showMainPage, setShowMainPage] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [outputData, setOutputData] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  //todo Keys (Place in .env files later for security)
  const domain = "dev-igx0eff32n6l7436.us.auth0.com"; 
  const clientId = "l9uS8Pp86tE0Oy3G75wNgvfIOUXxhCyh";


  // Function: Handle what happens when a user submits their input.
  const handleInputSubmit = () => {
    setOutputData(['Output 1', 'Output 2', 'Output 3']); // Pretend processing
  };

  // Function: Handle what happens when a user clicks the Get Started button.
  const handleGetStartedClick = () => {
    setIsAnimating(true); // Start the animation
    setTimeout(() => {
      setShowMainPage(true); // Switch to the main page after the animation ends
      setIsAnimating(false); // Reset animation state
    }, 420); // Match the CSS animation duration
  };

  // Function: Listen for the Enter key press to submit the input.
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleInputSubmit();
  };

  // Main Render
  return (
    <Auth0Provider domain={domain} clientId={clientId} redirectUri={window.location.origin}>
    <div className="app-background">
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Chunkify.ai</h1>
        </header>
        {!showMainPage ? (
          <div className={`landing-page-wrapper ${isAnimating ? 'slide-out-right-fade-out' : ''}`}>
            <h2 className="app-slogan">Where tasks meet their match. One chunk at a time.</h2>
            <button className="get-started-button" onClick={handleGetStartedClick}>Get Started</button>
          </div>
        ) : (
          <div className={`main-page-wrapper animated ${showMainPage && !isAnimating ? 'slide-in-right-fade-in' : ''}`}>
            <input 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              placeholder="Enter task here" 
              onKeyPress={handleKeyPress}
            />
            {outputData.length > 0 && (
              <div className="ai-popup-container">
                <h2>Break down into these tasks?</h2>
                <ol>
                  {outputData.map((item, index) => <li key={index}>{item}</li>)}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
      <LoginPage />
    </div>
    </Auth0Provider>
  );
}

export default App;
