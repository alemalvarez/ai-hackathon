import React, { useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import './Animations.css';
import GoogleLogo from '../images/google-logo.png';

function Body() {
    const [project, setProject] = useState('');
    const [details, setDetails] = useState('');
    const [subtasks, setSubtasks] = useState([]);
    const [error, setError] = useState('');
    const [isAnimating] = useState(false);
    const { loginWithRedirect, logout, isAuthenticated, user } = useAuth0();
    const [showMainPage] = useState(false);
    const [setOutputData] = useState([]);

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

    // Function: Handle what happens when a user clicks the Get Started button.
    const handleGetRequest = async () => {
        try {
            console.log('Sending GET request to /response');
            const response = await fetch(process.env.NODE_ENV === 'development' ? 'http://localhost:5001/response/' : '/response/');
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

    // Function: Listen for the Enter key press to submit the input.
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            handleInputSubmit();
        }
    };

    // Body if user is authenticated - Display the app normally.
    if (isAuthenticated) {
        return (
            <div className={`main-page-wrapper animated ${showMainPage && !isAnimating ? 'slide-in-right-fade-in' : ''}`}>
                <img 
                className="google-profile-picture"
                src={user.picture} 
                alt={`Log out ${user.name}`} 
                onClick={() => logout({ returnTo: window.location.origin })}
                style={{cursor: 'pointer'}} 
                />
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
        );
    } 
    // Body if user is not authenticated - Display the login button.
    else {
        return (
            <div className="login-page">
                    <button className="google-sign-in-button" onClick={() => loginWithRedirect({ connection: 'google-oauth2' })}>
                    <img src={GoogleLogo} className="google-logo" alt="Google Logo" />
                    Sign In with Google
                </button>
            </div>
        );
    }
}

export default Body;