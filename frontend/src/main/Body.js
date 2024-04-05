import React, { useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import './Animations.css';
import GoogleLogo from '../images/google-logo.png';

import { firestore } from './FirebaseConfig.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';


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
    const numTasks = 5; // Number of tasks to request from the AI model
    const [apiResponse, setApiResponse] = useState(null); // State to store API response temporarily
    const [isSaving, setIsSaving] = useState(false); // State to track if saving to Firestore is in progress

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
    // Function: Handle saving to Firestore
    const handleSaveToFirestore = async () => {
        setIsSaving(true); // Set saving state to true
        try {
            console.log('Storing data in Firestore');
            const docRef = await addDoc(collection(firestore, 'responses'), {
                ...apiResponse, // Save the API response data
                timestamp: new Date().toISOString(),
                userId: user?.sub, // Assuming user.sub contains the unique user identifier (UID)
            });
            console.log('Document written with ID: ', docRef.id);
            setApiResponse(null); // Clear the temporary API response data
        } catch (error) {
            console.error('Error storing data in Firestore:', error);
            setError('An error occurred while storing data.');
        } finally {
            setIsSaving(false); // Set saving state back to false after Firestore operation
        }
    };
    // Function: Save task to Firestore
    const saveTaskToFirestore = async () => {
        try {
            console.log('Storing Task in Firestore');
            const docRef = await addDoc(collection(firestore, 'queries'), {
                project,
                timestamp: new Date().toISOString(),
                userId: user?.sub, // Assuming user.sub contains the unique user identifier (UID)
            });
            console.log('Document written with ID: ', docRef.id);
        }
        catch (error) {
            console.error('Error storing data in Firestore:', error);
            setError('An error occurred while storing data.');
        }
    
    };
    // Function: Delete task from Firestore
    const deleteTask = async (taskId) => {
        try {
            await deleteDoc(doc(collection(firestore, 'queries'), taskId));
            console.log('Task deleted successfully');
            // Refresh the tasks list after deletion
            const tasks = await getTasksForUser(user?.sub);
            renderTasks(tasks);
        } catch (error) {
            console.error('Error deleting task from Firestore:', error);
            setError('An error occurred while deleting task.');
        }
    };
    // Function: Render tasks in the HTML
    const renderTasks = (tasks) => {
        const tasksListElement = document.getElementById('tasksList');
        if (tasksListElement) {
        // Clear previous content
        tasksListElement.innerHTML = '';
        tasks.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        // Create HTML elements for each task and append to the tasksListElement
        tasks.forEach((task) => {
            const taskElement = document.createElement('div');
            taskElement.innerHTML = `
                <ol class="user-task-list">
                    <div class="user-task-wrapper">
                        <div class="user-task">${task.project}</div>
                        <button class="user-task-delete-button" data-task-id="${task.id}">X</button>
                    </div>
                    <hr>
                </ol>
            `;
            tasksListElement.appendChild(taskElement);
        });
        tasksListElement.addEventListener('click', async (event) => {
            if (event.target.classList.contains('user-task-delete-button')) {
                event.preventDefault(); 
                const taskId = event.target.dataset.taskId;
                await deleteTask(taskId);
            }
        });
    } else
        console.error('tasksList element not found');
    };
    // Function: Fetch tasks for a user from Firestore
    const getTasksForUser = async (userId) => {
        if (!isAuthenticated || !user?.sub) {
            console.warn('User is not authenticated or user.sub is undefined');
            return []; // Return an empty array or handle as needed
        }
        try {
            console.log('getTasksForuser: Fetching tasks for user:', userId); // Log user ID for debugging
            const querySnapshot = await getDocs(query(collection(firestore, 'queries'), where('userId', '==', userId)));
            const tasks = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            return tasks;
        } catch (error) {
            console.error('Error fetching tasks from Firestore:', error);
            throw new Error('An error occurred while fetching tasks. Please try again later.'); // Update error message if needed
        }
    };
    // Function: Handle what happens when a user submits their input.
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Submitting form...');
        try {
            console.log('handleSubmit(): Sending POST request to /response');
            const response = await fetch(process.env.NODE_ENV === 'development' ? 'http://localhost:5001/response/' : '/response/', {
            //const response = await fetch('/response/', { // todo TEMPORARY for cors. also remove "  "proxy": "http://localhost:5001",  " in package.json
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
            setApiResponse(data);
            await handleSaveToFirestore();
            await saveTaskToFirestore();
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
    const userId = user?.sub; // Assuming user.sub contains the unique user identifier (UID)
    const fetchDataAndRenderTasks = async () => {
        const userTasks = await getTasksForUser(userId);
        renderTasks(userTasks); // Render tasks in HTML
    };
    fetchDataAndRenderTasks();

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

                    <div id="tasksList"></div>
                    {/* <button type="submit">Submit</button> */}
                    </form>
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