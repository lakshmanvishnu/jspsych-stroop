// DataPipe integration module
export const DataPipeConfig = {
  // Replace with your actual DataPipe experiment ID
  experimentId: 'rujuPr54kiXn',
  // DataPipe API endpoint
  apiUrl: 'https://pipe.jspsych.org/api/data/',
};

// Function to send data to DataPipe
export async function sendToDataPipe(data, userId) {
  try {
    // Add metadata to the data
    const dataToSend = {
      ...data,
      userId: userId,
      timestamp: new Date().toISOString(),
      platform: window.cordova ? 'cordova' : 'web',
      deviceInfo: window.device ? {
        platform: window.device.platform,
        version: window.device.version,
        model: window.device.model
      } : 'browser'
    };

    // Send to DataPipe
    const response = await fetch(DataPipeConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        experimentID: DataPipeConfig.experimentId,
        filename:"TEST.csv",
        data: dataAsString,
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Data successfully sent to DataPipe:', result);
    return { success: true, result };
  } catch (error) {
    console.error('Error sending data to DataPipe:', error);
    // Store failed submission locally for retry
    if (window.cordova) {
      storeFailedSubmission(data, userId);
    }
    return { success: false, error: error.message };
  }
}

// Store failed submissions for later retry
function storeFailedSubmission(data, userId) {
  window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(directoryEntry) {
    const filename = `failed_submission_${Date.now()}.json`;
    directoryEntry.getFile(filename, { create: true }, function(fileEntry) {
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onwriteend = function() {
          console.log('Failed submission saved for retry');
        };
        const blob = new Blob([JSON.stringify({ data, userId })], { type: 'application/json' });
        fileWriter.write(blob);
      });
    });
  });
}

// Check and retry failed submissions
export async function retryFailedSubmissions() {
  if (!window.cordova) return;
  
  window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(directoryEntry) {
    directoryEntry.createReader().readEntries(function(entries) {
      entries.forEach(entry => {
        if (entry.name.startsWith('failed_submission_')) {
          entry.file(function(file) {
            const reader = new FileReader();
            reader.onloadend = async function() {
              try {
                const { data, userId } = JSON.parse(this.result);
                const result = await sendToDataPipe(data, userId);
                if (result.success) {
                  // Delete the file after successful retry
                  entry.remove(() => console.log('Removed successful retry file'));
                }
              } catch (e) {
                console.error('Error retrying submission:', e);
              }
            };
            reader.readAsText(file);
          });
        }
      });
    });
  });
}

// Create a completion screen with DataPipe integration
export function createCompletionScreen(jsPsych, userId) {
  return {
    type: jsPsychHtmlButtonResponse,
    stimulus: function() {
      return `
        <div style="text-align: center;">
          <h2>Experiment Complete!</h2>
          <p>Thank you for participating.</p>
          <p>Your data is being submitted...</p>
          <div id="submission-status" style="margin: 20px 0;">
            <div class="spinner" style="border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          </div>
          <p>Your User ID: <strong>${userId}</strong></p>
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
    button_html: '<button class="jspsych-btn" style="display: none;">%choice%</button>',
    on_load: async function() {
      // Get all experiment data
      const allData = jsPsych.data.get().json();
      
      // Send to DataPipe
      const result = await sendToDataPipe(allData, userId);
      
      // Update the display based on result
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
          <p style="color: orange; font-weight: bold;">Submission failed - data saved locally</p>
          <p>Your data has been saved and will be submitted when you have an internet connection.</p>
        `;
      }
      
      // Show the continue button
      button.style.display = 'inline-block';
    }
  };
}