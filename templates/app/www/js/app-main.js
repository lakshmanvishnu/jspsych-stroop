// app-main.js - Complete app without ES6 modules

// Global app namespace
window.MyApp = window.MyApp || {};

// Main initialization
window.MyApp.initialize = function() {
  console.log('Initializing app...');
 
  document.addEventListener('deviceready', onDeviceReady, false);
 
  // If not in Cordova, fire immediately
  if (!window.cordova) {
    console.log('Not in Cordova, initializing immediately');
    onDeviceReady();
  }
};

async function onDeviceReady() {
  console.log('Device ready!');
  console.log('Platform:', window.device ? window.device.platform : 'unknown');
 
  // Check for existing user ID
  let existingUserId = null;
  if (typeof localStorage !== 'undefined') {
    existingUserId = localStorage.getItem('userId');
  }
 
  const jsPsych = initJsPsych({
    display_element: 'jspsych-target',
    on_finish: function() {
      console.log('Experiment completed');
    }
  });
 
  const timeline = [];
  let userId = existingUserId;
 
  if (!existingUserId) {
    console.log('No existing user ID, showing profile screen');
   
 
  // Add completion screen if DataPipe is enabled
  if (window.MyApp.DataPipeEnabled) {
    timeline.push({
      type: jsPsychHtmlButtonResponse,
      stimulus: `
        <div style="text-align: center;">
          <h2>Experiment Complete!</h2>
          <p>Thank you for participating.</p>
          <p>Your User ID: <strong>${userId || 'unknown'}</strong></p>
        </div>
      `,
      choices: ['Finish']
    });
  }
 
  // Run the experiment
  console.log('Starting experiment with', timeline.length, 'trials');
  jsPsych.run(timeline);
}

// Auto-initialize when script loads
window.MyApp.initialize();
}