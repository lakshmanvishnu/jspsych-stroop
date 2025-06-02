// Main experiment runner
import { run as runProfileExperiment, checkUserId } from './experiments/profile/index.js';
import { run as runSampleExperiment } from './experiments/sample-experiment/index.js';

document.addEventListener('deviceready', onDeviceReady, false);

if (!window.cordova) {
    onDeviceReady();
}

async function onDeviceReady() {
    // Check if user already has an ID
    const existingUserId = await checkUserId();
    
    const jsPsych = initJsPsych({
        on_finish: function() {
            jsPsych.data.displayData();
        }
    });

    // Combine all experiments
    const timeline = [];
    
    // Only show profile screen if user doesn't have an ID
    if (!existingUserId) {
        console.log('No existing user ID found, showing profile screen');
        timeline.push(...runProfileExperiment(jsPsych));
    } else {
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
    
    // Run the combined timeline
    jsPsych.run(timeline);
}