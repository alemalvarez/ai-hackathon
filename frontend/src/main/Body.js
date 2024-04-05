import React, { useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import './Animations.css';
import GoogleLogo from '../images/google-logo.png';


// Component: AI Task Suggestions Popup
function AIPopup({ subtasks }) {
    return (
        <div className="ai-popup-container slide-in-right-fade-in">
            <ol className="ai-task-list">
                {subtasks.map((subtask, index) => (
                    <li className="ai-task" key={index}>{subtask}</li>
                ))}
            </ol>
            <div className = "ai-popup-button-container">
                <button className="ai-popup-button add">Add</button>
                <button className="ai-popup-button refresh">Refresh</button>
                <button className="ai-popup-button close">Close</button>
            </div>
        </div>
    );
}


// Component: Main Body of the App
function Body() {
    const [project, setProject] = useState('');
    const [details, setDetails] = useState('');
    const [subtasks, setSubtasks] = useState([]);
    const [error, setError] = useState('');
    const [isAnimating] = useState(false);
    const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
    const [showMainPage] = useState(false);
    const [showDetails, setShowDetails] = useState(false); // State to show/hide the details input field
    const [hidingDetails, setHidingDetails] = useState(false); // New state to manage hiding animation
    const numTasks = 3; // Number of tasks to request from the AI model
    // Function: Toggle details visibility
    const toggleDetails = () => {
        if (showDetails) {
            setHidingDetails(true); // Start the hide animation
            setTimeout(() => {
                setShowDetails(false);
                setHidingDetails(false); // Reset state after animation completes
            }, 600); // Duration should match the CSS animation time
        } else {
            setShowDetails(true);
        }
    };

    // Function: Handle what happens when a user submits their input.
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting form...');
        try {
            console.log('Sending POST request to /response');
            const response = await fetch(process.env.NODE_ENV === 'development' ? 'http://localhost:5001/response/' : '/response/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ project, details, numTasks }),
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

    // Function: Listen for the Enter key press to submit the input.
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            handleSubmit(e);
        }
    };

    // Body if user is logged in - Display the app normally.
    if (isAuthenticated) {
        return (
            <main className={`main-page animated ${showMainPage && !isAnimating ? 'slide-in-right-fade-in' : ''}`}>
                <img 
                className="google-profile-picture"
                src={user.picture} 
                alt={`Log out ${user.name}`} 
                onClick={() => logout({ returnTo: window.location.origin })}
                style={{cursor: 'pointer'}} 
                />

                {/* Left side of the main app */}
                <div className="main-left">
                    <form onSubmit={handleSubmit}>
                        <div class="user-task-input-wrapper">
                            {/* Task Input Field */}
                            <input
                                type="text"
                                id="project"
                                value={project}
                                onChange={(e) => setProject(e.target.value)}
                                placeholder="Enter task name..."
                                onKeyPress={handleKeyPress}
                                className="input-field"
                            />
                            <button className="submit-button" type="submit"></button>
                        </div>
                        {/* Triangle toggle button for showing/hiding details */}
                        <div class="toggle-container" onClick={toggleDetails}>
                            <p>Optional: Add Details</p>
                            <div
                                className={`triangle ${showDetails ? 'open' : ''}`} // This class changes based on the state
                            ></div>
                        </div>
                        {/* Details Input Field; with animation */}
                        {(showDetails || hidingDetails) && (
                        <input
                            type="text"
                            id="details"
                            value={details}
                            placeholder="Optional: Any additional details?"
                            onChange={(e) => setDetails(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className={`details-input ${hidingDetails ? 'hiding' : ''}`}
                        />
                        )}
                    </form>
                    <div className="user-tasks">
                        {/* <h2>Your Tasks</h2> */}
                        <ol className="user-task-list"> 
                            <li> Task 1 Filler </li>
                            <li> Task 2 Filler </li>
                            <li> Task 3 Filler </li>
                        </ol>
                    </div>
                </div>
                
                {/* Right side of the main app */}
                <div class="main-right">
                    <h2>Chunkify Suggestions</h2>
                    {subtasks.length > 0 && (
                        <AIPopup subtasks={subtasks} />
                    )}
                </div>
                {error && <p>{error}</p>}
            </main>
        );
    } 
    // Body if user is not logged in - Display the login button.
    else {
        return (
            <div className="login-page">
                    <h2 className="app-slogan">Where tasks meet their match. One chunk at a time.</h2>
                    <button className="google-sign-in-button" onClick={() => loginWithRedirect({ connection: 'google-oauth2' })}>
                    <img src={GoogleLogo} className="google-logo" alt="Google Logo" />
                    Sign In with Google
                </button>
            </div>
        );
    }
}

export default Body;