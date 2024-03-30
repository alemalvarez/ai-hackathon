import React, { useState } from 'react'; // useState for conditional rendering
import './App.css';
// import appLogo from './images/app-logo.png';

function App() {
  const [showMainPage, setShowMainPage] = useState(false); // State for conditional rendering

  return (
    <div className="app-background">
      <div className="app">
        <header className="app-header">
          <h1 className="app-title">Chunkify.ai</h1>
          {/* <img src={appLogo} className="app-logo" alt="logo" /> */}
        </header>

        {/* Conditional rendering based on showMainPage state */}
        {!showMainPage ? ( 
          // Landing Page - Disappears after clicking 'Get Started'
          <div className="landing-page-wrapper">
            <h2 className="app-slogan">Where tasks meet their match. One chunk at a time.</h2>
            <button className="get-started-button" onClick={() => setShowMainPage(true)}>Get Started</button> {/* Step 4: Set state on click */}
          </div>
        ) : (
          // Main Page - Appears after clicking 'Get Started'
          <div className="main-page-wrapper">
            <p>Welcome to Chunkify.ai</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
