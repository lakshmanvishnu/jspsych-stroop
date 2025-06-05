// app-main.js - Complete app without ES6 modules

// Global app namespace
window.MyApp = window.MyApp || {};

// DataPipe configuration
window.MyApp.DataPipeEnabled = false;
window.MyApp.DataPipeConfig = {
  experimentId: 'EXPERIMENT-ID',
  apiUrl: 'https://pipe.jspsych.org/api/data/',
};

// DataPipe functions
window.MyApp.convertToCSV = function(data) {
  if (!data || data.length === 0) {
    return '';
  }
 
  const allKeys = new Set();
  data.forEach(trial => {
    Object.keys(trial).forEach(key => allKeys.add(key));
  });
 
  const headers = Array.from(allKeys).sort();
  const csvRows = [headers.join(',')];
 
  data.forEach(trial => {
    const row = headers.map(header => {
      const value = trial[header];
      if (value === undefined || value === null) {
        return '';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value).replace(/,/g, ';');
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(row.join(','));
  });
 
  return csvRows.join('\n');
};

window.MyApp.sendToDataPipe = async function(data, userId, updateStatus) {
  try {
    updateStatus('Preparing data for submission...');
    const dataAsString = window.MyApp.convertToCSV(data);
   
    if (!dataAsString) {
      throw new Error('No data to send');
    }
   
    updateStatus('Connecting to DataPipe server...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${userId}_${timestamp}.csv`;
   
    updateStatus('Uploading data to DataPipe...');
   
    const response = await fetch(window.MyApp.DataPipeConfig.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "*/*",
      },
      body: JSON.stringify({
        experimentID: window.MyApp.DataPipeConfig.experimentId,
        filename: filename,
        data: dataAsString,
      }),
    });

    updateStatus('Processing server response...');
    const responseText = await response.text();
   
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      result = { message: responseText };
    }
   
    updateStatus('Data submitted successfully!');
    return { success: true, result };
   
  } catch (error) {
    console.error('Error sending data to DataPipe:', error);
    updateStatus(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

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