// app.js - Main application logic that loads experiments dynamically

// List of experiments to load
const EXPERIMENTS = [
    'profile',
    'sample-experiment'
];

// Initialize the app
async function initializeApp() {
    console.log('Initializing jsPsych app...');
    
    // Load all experiments
    await window.ExperimentLoader.loadExperiments(EXPERIMENTS);
    
    // Get loaded experiments
    const experiments = window.ExperimentLoader.getAll();
    console.log('Loaded experiments:', Object.keys(experiments));
    
    // Check for existing user ID
    const profileExperiment = window.ExperimentLoader.get('profile');
    const existingUserId = profileExperiment && profileExperiment.checkUserId
        ? await profileExperiment.checkUserId()
        : localStorage.getItem('jspsych_userId');
    
    // Initialize jsPsych
    const jsPsych = initJsPsych({
        display_element: 'jspsych-target',
        on_finish: function() {
            console.log('All experiments completed');
        }
    });
    
    // Build timeline
    const timeline = [];
    let userId = existingUserId;
    
    // Show profile if no user ID exists
    if (!existingUserId && experiments.profile) {
        console.log('No user ID found, showing profile experiment');
        timeline.push(...experiments.profile.run(jsPsych));
        
        // Capture userId after profile
        timeline.push({
            type: jsPsychCallFunction,
            func: function() {
                const allData = jsPsych.data.get().values();
                const profileData = allData.find(trial => trial.userId);
                if (profileData) {
                    userId = profileData.userId;
                    console.log('Captured userId:', userId);
                    jsPsych.data.addProperties({ userId: userId });
                }
            }
        });
    } else if (existingUserId) {
        console.log('User ID exists:', existingUserId);
        userId = existingUserId;
        jsPsych.data.addProperties({
            userId: existingUserId,
            profileCompleted: true
        });
        
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2>Welcome Back!</h2>
                <p>Your User ID: <strong style="font-family: monospace;">${existingUserId}</strong></p>
                <p>Press the button below to continue.</p>`,
            choices: ['Continue']
        });
    }
    
    // Add all other experiments
    for (const [name, experiment] of Object.entries(experiments)) {
        if (name !== 'profile' && experiment.run) {
            console.log(`Adding experiment: ${name}`);
            timeline.push(...experiment.run(jsPsych));
        }
    }
    
    // Add completion screen with DataPipe integration
    if (window.DataPipeEnabled) {
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: function() {
                const finalUserId = userId || 'unknown_' + Date.now();
                console.log('Creating completion screen HTML with userId:', finalUserId);
                
                return `
                    <div style="text-align: center;">
                        <h2>Experiment Complete!</h2>
                        <p>Thank you for participating.</p>
                        <p>Your data is being submitted...</p>
                        <div id="submission-status" style="margin: 20px 0;">
                            <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                            <p id="current-status" style="margin-top: 10px; color: #666; font-style: italic;">Initializing...</p>
                        </div>
                        <p>Your User ID: <strong>${finalUserId}</strong></p>
                        <p>Please save this ID for your records.</p>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `;
            },
            choices: ['Continue'],
            button_html: (choice) => `<button class="jspsych-btn" style="display: none;">${choice}</button>`,
            on_load: async function() {
                console.log('Completion screen loaded - starting data submission');
                
                const statusElement = document.getElementById('current-status');
                const updateStatus = (message) => {
                    console.log('Status update:', message);
                    if (statusElement) {
                        statusElement.textContent = message;
                    }
                };
                
                try {
                    updateStatus('Retrieving experiment data...');
                    
                    const finalUserId = userId || 'unknown_' + Date.now();
                    
                    const allData = jsPsych.data.get().values();
                    console.log('Total trials collected:', allData.length);
                    
                    if (allData.length === 0) {
                        throw new Error('No experiment data found');
                    }
                    
                    updateStatus('Sending data to server...');
                    const result = await window.sendToDataPipe(allData, finalUserId, updateStatus);
                    
                    const statusDiv = document.getElementById('submission-status');
                    const button = document.querySelector('.jspsych-btn');
                    
                    if (result.success) {
                        statusDiv.innerHTML = `
                            <div style="color: green; font-size: 48px;">✓</div>
                            <p style="color: green; font-weight: bold;">Data submitted successfully!</p>
                        `;
                    } else {
                        statusDiv.innerHTML = `
                            <div style="color: orange; font-size: 48px;">⚠</div>
                            <p style="color: orange; font-weight: bold;">Submission failed</p>
                            <p>Error: ${result.error}</p>
                        `;
                    }
                    
                    button.style.display = 'inline-block';
                    
                } catch (error) {
                    console.error('Error during submission:', error);
                    updateStatus(`Error: ${error.message}`);
                    
                    const statusDiv = document.getElementById('submission-status');
                    const button = document.querySelector('.jspsych-btn');
                    
                    statusDiv.innerHTML = `
                        <div style="color: red; font-size: 48px;">✗</div>
                        <p style="color: red; font-weight: bold;">An error occurred</p>
                        <p>${error.message}</p>
                    `;
                    
                    button.style.display = 'inline-block';
                }
            }
        });
    } else {
        // No DataPipe - simple completion screen
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: function() {
                return `
                    <div style="text-align: center;">
                        <h2>Experiment Complete!</h2>
                        <p>Thank you for participating.</p>
                        <p>Your User ID: <strong>${userId || 'unknown'}</strong></p>
                    </div>
                `;
            },
            choices: ['Finish']
        });
    }
    
    // Run all experiments
    console.log(`Running ${timeline.length} trials`);
    jsPsych.run(timeline);
    
    // Retry any failed submissions
    if (window.retryFailedSubmissions) {
        window.retryFailedSubmissions();
    }
}

// Wait for device ready
document.addEventListener('deviceready', initializeApp, false);

// If not in Cordova, initialize immediately
if (!window.cordova) {
    document.addEventListener('DOMContentLoaded', initializeApp);
}