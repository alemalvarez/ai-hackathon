import React, { useState } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import './App.css';
import './Animations.css';
import GoogleLogo from '../images/google-logo.png';
import { firestore } from './firebaseconfig.js';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
// Component: AI Task Suggestions Popup
function AIPopup({ subtasks }) {
    return (
        <div className="ai-popup-container">
            <h2>Tasks</h2>
            <ol>
                {subtasks.map((subtask, index) => (
                    <li key={index}>{subtask}</li>
                ))}
            </ol>
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
    const renderTasks = (tasks) => {
        const tasksListElement = document.getElementById('tasksList');
    
        // Clear previous content
        tasksListElement.innerHTML = '';
        tasks.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        // Create HTML elements for each task and append to the tasksListElement
        tasks.forEach((task) => {
            const taskElement = document.createElement('div');
            taskElement.innerHTML = `
                <div>Project: ${task.project}</div>
                <button class="delete-btn" data-task-id="${task.id}">Delete</button>
                <hr>
            `;
            tasksListElement.appendChild(taskElement);
        });
        tasksListElement.addEventListener('click', async (event) => {
            if (event.target.classList.contains('delete-btn')) {
                event.preventDefault(); // P
                const taskId = event.target.dataset.taskId;
                await deleteTask(taskId);
            }
        });
    };
    const getTasksForUser = async (userId) => {
        try {
            console.log('Fetching tasks for user:', userId); // Log user ID for debugging
            const querySnapshot = await getDocs(query(collection(firestore, 'queries'), where('userId', '==', user?.sub)));
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
            setApiResponse(data);
            await saveTaskToFirestore();
        } catch (error) {
            console.error('Error:', error);
            setError('An error occurred while fetching data.');
        }
    };

    // const handleSaveToFirestore = async () => {
    //     setIsSaving(true); // Set saving state to true
    //     try {
    //         console.log('Storing data in Firestore');
    //         await firestore.collection('responses').add({
    //             ...apiResponse, // Save the API response data
    //             timestamp: new Date().toISOString(),
    //             userId: user.sub, // Assuming user.sub contains the unique user identifier (UID)
    //         });
    //         console.log('Data stored in Firestore');
    //         setApiResponse(null); // Clear the temporary API response data
    //     } catch (error) {
    //         console.error('Error storing data in Firestore:', error);
    //         setError('An error occurred while storing data.');
    //     } finally {
    //         setIsSaving(false); // Set saving state back to false after Firestore operation
    //     }
    // };
    // Function: Listen for the Enter key press to submit the input.
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
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
            <div className={`main-page-wrapper animated ${showMainPage && !isAnimating ? 'slide-in-right-fade-in' : ''}`}>
                <img 
                className="google-profile-picture"
                src={user.picture} 
                alt={`Log out ${user.name}`} 
                onClick={() => logout({ returnTo: window.location.origin })}
                style={{cursor: 'pointer'}} 
                />
                <form onSubmit={handleSubmit}>
                    <div class="task-wrapper">
                        {/*<!-- Task --> */}
                        <input
                            type="text"
                            id="project"
                            value={project}
                            onChange={(e) => setProject(e.target.value)}
                            placeholder="What you want to do?"
                            onKeyPress={handleKeyPress}
                        />
                        {/* Triangle toggle button for showing/hiding details */}
                        <div
                            className={`triangle ${showDetails ? 'open' : ''}`} // This class changes based on the state
                            onClick={toggleDetails}
                        ></div>
                    </div>

                    {/* Conditional rendering for Details input with animation */}
                    {(showDetails || hidingDetails) && (
                        <input
                            type="text"
                            id="details"
                            value={details}
                            placeholder="Optional: Any additional details?"
                            onChange={(e) => setDetails(e.target.value)}
                            className={`details-input ${hidingDetails ? 'hiding' : ''}`}
                        />
                    )}
                    
                    {/* Save button for API response */}
                <button type="button" onClick={handleSubmit} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Get API Response'}
                </button>
                {/* Save button for Firestore */}
                {apiResponse && (
                    <button type="button" onClick={handleSaveToFirestore} disabled={isSaving}>
                        {isSaving ? 'Saving to Firestore...' : 'Save to Firestore'}
                    </button>
                )}
                    <div id="tasksList"></div>
                    {/* <button type="submit">Submit</button> */}
                </form>
                {subtasks.length > 0 && (
                    <AIPopup subtasks={subtasks} />
                )}
                
                 <div id="tasksList"></div>
                {error && <p>{error}</p>}
            </div>
            
        );
        
    } 
    // Body if user is not logged in - Display the login button.
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