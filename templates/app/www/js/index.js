// Main experiment runner
import { run as runProfileExperiment, checkUserId } from './experiments/profile/index.js';
import { run as runSampleExperiment } from './experiments/sample-experiment/index.js';
import { createCompletionScreen, retryFailedSubmissions } from './datapipe-config.js';

document.addEventListener('deviceready', onDeviceReady, false);

if (!window.cordova) {
    onDeviceReady();
}

async function onDeviceReady() {
    // Check if user already has an ID
    const existingUserId = await checkUserId();
    
    // Retry any failed submissions when app starts
    if (existingUserId) {
        retryFailedSubmissions();
    }
    
    const jsPsych = initJsPsych({
        on_finish: function() {
            // Don't display data immediately - it will be handled by completion screen
            console.log('Experiment finished, data will be sent to DataPipe');
        }
    });

    // Combine all experiments
    const timeline = [];
    
    let userId;
    
    // Only show profile screen if user doesn't have an ID
    if (!existingUserId) {
        console.log('No existing user ID found, showing profile screen');
        timeline.push(...runProfileExperiment(jsPsych));
    } else {
        userId = existingUserId;
        console.log('User ID already exists:', existingUserId);
        // Add the existing user ID to the data
        jsPsych.data.addProperties({
            userId: existingUserId,
            profileCompleted: true
        });
        
        // Optional: Show a brief welcome back message
        const welcomeBack = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `
                <h2>Welcome Back!</h2>
                <p>Your User ID: <strong style="font-family: monospace;">${existingUserId}</strong></p>
                <p>Press any key to continue.</p>
            `,
            choices: "ALL_KEYS",
            trial_duration: 3000 // Auto-advance after 3 seconds
        };
        timeline.push(welcomeBack);
    }
    
    // Add your main experiments here
    timeline.push(...runSampleExperiment(jsPsych));
    
    // Add completion screen with DataPipe submission
    timeline.push({
        type: jsPsychCall,
        func: function() {
            // Get userId from data if we don't have it yet
            if (!userId) {
                const profileData = jsPsych.data.get().filter({profileCompleted: true}).values()[0];
                userId = profileData ? profileData.userId : 'unknown';
            }
            return userId;
        },
        on_finish: function(data) {
            userId = data.value;
        }
    });
    
    // Add the completion screen
    timeline.push(createCompletionScreen(jsPsych, userId));
    
    // Final screen
    timeline.push({
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
            <h2>Thank you!</h2>
            <p>You may now close the app.</p>
            <p>Press any key to end.</p>
        `,
        on_finish: function() {
            // Optionally close the app on mobile
            if (window.cordova && navigator.app && navigator.app.exitApp) {
                setTimeout(() => navigator.app.exitApp(), 1000);
            }
        }
    });
    
    // Run the combined timeline
    jsPsych.run(timeline);
}