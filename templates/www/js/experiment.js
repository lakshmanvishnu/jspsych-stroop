/* global jsPsych */

// Wait for device ready if running in Cordova
document.addEventListener('deviceready', onDeviceReady, false);

// Also run if we're in a browser
if (!window.cordova) {
    onDeviceReady();
}

function onDeviceReady() {
    // Initialize jsPsych
    const jsPsych = initJsPsych({
        on_finish: function() {
            jsPsych.data.displayData();
        }
    });

    // Create timeline
    const timeline = [];

    // Welcome screen
    const welcome = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<h1>Welcome to jsPsych!</h1><p>Press any key to begin.</p>'
    };
    timeline.push(welcome);

    // Instructions
    const instructions = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
            <h2>Instructions</h2>
            <p>This is a sample jsPsych experiment running in Cordova.</p>
            <p>Press any key to continue.</p>
        `
    };
    timeline.push(instructions);

    // Run the experiment
    jsPsych.run(timeline);
}