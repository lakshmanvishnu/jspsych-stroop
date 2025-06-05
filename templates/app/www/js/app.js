// app.js - Main application logic with notification support

// List of experiments to load
const EXPERIMENTS = [
    'profile',
    'sample-experiment'
];

// Function to setup notifications
function setupNotifications(userId) {
    if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.notification) {
        console.log('Notification plugin not available');
        return;
    }
    
    const notificationsSetup = localStorage.getItem('notificationsSetup');
    
    if (!notificationsSetup) {
        console.log('Setting up notifications for the first time...');
        
        cordova.plugins.notification.local.hasPermission(function(granted) {
            console.log('Permission granted: ' + granted);
            
            if (!granted) {
                cordova.plugins.notification.local.requestPermission(function(granted) {
                    console.log('Permission request result: ' + granted);
                    if (granted) {
                        scheduleNotifications(userId);
                    }
                });
            } else {
                scheduleNotifications(userId);
            }
        });
    } else {
        console.log('Notifications already set up');
    }
}

function scheduleNotifications(userId) {
    console.log('Scheduling notifications...');
    
    // Use the notification manager
    if (window.notificationManager) {
        // Cancel any existing notifications first
        window.notificationManager.cancelAllNotifications();
        
        // Schedule a test notification
        window.notificationManager.scheduleNotification({
            title: 'Test Notification',
            text: 'Notifications are working!',
            trigger: { at: new Date(Date.now() + 10000) }
        });
        
        // Schedule recurring notifications
        window.notificationManager.scheduleRecurringNotifications({
            title: `Hi ${userId}, time for your experiment!`,
            text: 'Your jsPsych task is ready',
            interval: 1 // Every minute for testing
        });
        
        // Schedule multiple notifications
        const schedules = [];
        for (let i = 1; i <= 5; i++) {
            schedules.push({
                title: `Reminder ${i}`,
                text: `This is notification ${i} - scheduled for ${i} minute(s) from now`,
                time: new Date(Date.now() + (i * 60000))
            });
        }
        window.notificationManager.scheduleMultipleNotifications(schedules);
        
        localStorage.setItem('notificationsSetup', 'true');
        console.log('Notification setup complete');
    }
}

// Initialize the app
async function initializeApp() {
    console.log('Initializing jsPsych app...');
    
    // Setup notification handlers
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.notification) {
        cordova.plugins.notification.local.on('click', function(notification) {
            console.log('Notification clicked:', notification);
        });
        
        cordova.plugins.notification.local.on('trigger', function(notification) {
            console.log('Notification triggered:', notification);
        });
    }
    
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
                    localStorage.setItem('jspsych_userId', userId);
                    jsPsych.data.addProperties({ userId: userId });
                    // Setup notifications for new user
                    setupNotifications(userId);
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
        
        // Ensure notifications are set up
        setupNotifications(existingUserId);
        
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: `<h2>Welcome Back!</h2>
                <p>Your User ID: <strong style="font-family: monospace;">${existingUserId}</strong></p>
                <p>Press the button below to continue.</p>`,
            choices: ['Continue']
        });
    }
    
    // Add notification test screen
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <h3>Notification Test</h3>
            <p>Notifications have been scheduled. You should receive:</p>
            <ul style="text-align: left;">
                <li>A test notification in 10 seconds</li>
                <li>5 notifications over the next 5 minutes</li>
                <li>Recurring notifications every minute</li>
            </ul>
            <p>Check your notification bar!</p>
        `,
        choices: ['Continue']
    });
    
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
        // Add this to your timeline for testing
timeline.push({
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h3>Direct Notification Test</h3>
        <p>Click the button below to schedule a test notification.</p>
        <button onclick="testNotification()" style="padding: 10px 20px; margin: 10px;">
            Test Notification Now
        </button>
    `,
    choices: ['Continue']
});

// Add this function to the global scope
window.testNotification = function() {
    console.log('Testing notification...');
    
    if (!window.cordova || !window.cordova.plugins || !window.cordova.plugins.notification) {
        alert('Notification plugin not available');
        return;
    }
    
    cordova.plugins.notification.local.schedule({
        title: 'Direct Test',
        text: 'You clicked the button!',
        foreground: true,
        trigger: { in: 3, unit: 'second' }
    });
    
    alert('Notification scheduled for 3 seconds from now. Put app in background to see it!');
};
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