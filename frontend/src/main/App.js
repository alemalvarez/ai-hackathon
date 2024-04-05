import React, { useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import './Animations.css';
import Body from './Body';
import AppLogo from '../images/app-logo.png';

function App() {
  const [isAnimating] = useState(false);
  const domain = process.env.REACT_APP_DOMAIN;
  const clientId = process.env.REACT_APP_CLIENT_ID;

  return (
    <Auth0Provider domain={domain} clientId={clientId} redirectUri={window.location.origin}>
    <div className="app-background">
      <div className="app">
          <div className="app-header">
            <h1 className="app-title">Chunkify.ai</h1>
            <img src={AppLogo} alt="Chunkify.ai Logo" className="app-logo" />
          </div>
          
          <div className={`landing-page-wrapper ${isAnimating ? 'slide-out-right-fade-out' : ''}`}>
          </div>
          <Body />
      </div>
    </div>
    </Auth0Provider>
  );
}

export default App;
