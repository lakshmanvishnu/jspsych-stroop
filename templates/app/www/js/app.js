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
            if (window.MyApp && window.MyApp.DataPipeEnabled) {
                console.log('DataPipe is enabled, data would be sent here');
            }
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
   
    // Add completion screen
    timeline.push({
        type: jsPsychHtmlButtonResponse,
        stimulus: function() {
            return `
                <div style="text-align: center;">
                    <h2>All Experiments Complete!</h2>
                    <p>Thank you for participating.</p>
                    <p>Your User ID: <strong>${userId || 'unknown'}</strong></p>
                    ${window.MyApp && window.MyApp.DataPipeEnabled ?
                        '<p>Your data has been submitted.</p>' :
                        '<p>Data submission is currently disabled.</p>'}
                </div>
            `;
        },
        choices: ['Finish']
    });
   
    // Run all experiments
    console.log(`Running ${timeline.length} trials`);
    jsPsych.run(timeline);
}

// Wait for device ready
document.addEventListener('deviceready', initializeApp, false);

// If not in Cordova, initialize immediately
if (!window.cordova) {
    document.addEventListener('DOMContentLoaded', initializeApp);
}