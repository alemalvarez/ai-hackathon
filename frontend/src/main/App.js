import React, { useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import './Animations.css';
import Body from './Body';


function App() {
  // Let's keep track of what we're showing.
  const [isAnimating, setIsAnimating] = useState(false);
  const { isAuthenticated } = useAuth0();
  // Frontend States
  const [showMainPage, setShowMainPage] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [outputData, setOutputData] = useState([]);

  // Backend States
  const [project, setProject] = useState('');
  const [details, setDetails] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [error, setError] = useState('');

  const shouldShowMainPage = isAuthenticated && showMainPage;

  const domain = process.env.REACT_APP_DOMAIN;
  const clientId = process.env.REACT_APP_CLIENT_ID;

  return (
    <Auth0Provider domain={domain} clientId={clientId} redirectUri={window.location.origin}>
    <div className="app-background">
      <div className="app">
        {/* Simplified condition for showing landing or main content */}
          <div className={`landing-page-wrapper ${isAnimating ? 'slide-out-right-fade-out' : ''}`}>
            <h1 className="app-title">Chunkify.ai</h1>
            <h2 className="app-slogan">Where tasks meet their match. One chunk at a time.</h2>
            <Body />
          </div>
      </div>

    </div>
    </Auth0Provider>
  );
}

export default App;
