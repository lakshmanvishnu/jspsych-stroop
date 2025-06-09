// datapipe-config.js - Non-module version for iOS compatibility
(function() {
    
    // DataPipe configuration
    window.DataPipeEnabled = false;
    window.DataPipeConfig = {
        experimentId: 'EXPERIMENT-ID',
        apiUrl: 'https://pipe.jspsych.org/api/data/',
    };
    
    // Convert jsPsych data to CSV format
    function convertToCSV(data) {
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
    }
    
    // Function to send data to DataPipe
    window.sendToDataPipe = async function(data, userId, updateStatus) {
        try {
            updateStatus('Preparing data for submission...');
            
            const dataAsString = convertToCSV(data);
            
            if (!dataAsString) {
                throw new Error('No data to send');
            }
            
            updateStatus('Connecting to DataPipe server...');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `${userId}_${timestamp}.csv`;
            
            console.log('Sending to DataPipe:', {
                experimentID: window.DataPipeConfig.experimentId,
                filename: filename,
                dataLength: dataAsString.length,
                preview: dataAsString.substring(0, 200) + '...'
            });
            
            updateStatus('Uploading data to DataPipe...');
            
            const response = await fetch(window.DataPipeConfig.apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "*/*",
                },
                body: JSON.stringify({
                    experimentID: window.DataPipeConfig.experimentId,
                    filename: filename,
                    data: dataAsString,
                }),
            });
            
            updateStatus('Processing server response...');
            
            const responseText = await response.text();
            console.log('DataPipe response:', response.status, responseText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
            }
            
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                result = { message: responseText };
            }
            
            console.log('Data successfully sent to DataPipe:', result);
            updateStatus('Data submitted successfully!');
            return { success: true, result };
            
        } catch (error) {
            console.error('Error sending data to DataPipe:', error);
            updateStatus(`Error: ${error.message}`);
            
            if (window.cordova) {
                storeFailedSubmission(data, userId);
            }
            return { success: false, error: error.message };
        }
    };
    
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
    window.retryFailedSubmissions = async function() {
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
                                    const result = await window.sendToDataPipe(data, userId, (status) => console.log('Retry status:', status));
                                    if (result.success) {
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
    };
    
    // Create a completion screen with DataPipe integration
    window.createCompletionScreen = function(jsPsych, userId) {
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
                            <p id="current-status" style="margin-top: 10px; color: #666; font-style: italic;">Initializing...</p>
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
            button_html: (choice) => `<button class="jspsych-btn" style="display: none;">${choice}</button>`,
            on_load: async function() {
                console.log('Completion screen on_load triggered');
                
                const statusElement = document.getElementById('current-status');
                const updateStatus = (message) => {
                    console.log('Status:', message);
                    if (statusElement) {
                        statusElement.textContent = message;
                    } else {
                        console.error('Status element not found!');
                    }
                };
                
                try {
                    updateStatus('Retrieving experiment data...');
                    
                    const allData = jsPsych.data.get().values();
                    console.log('Total trials to send:', allData.length);
                    
                    if (allData.length === 0) {
                        throw new Error('No experiment data found');
                    }
                    
                    const result = await window.sendToDataPipe(allData, userId, updateStatus);
                    
                    const statusDiv = document.getElementById('submission-status');
                    const button = document.querySelector('.jspsych-btn');
                    
                    if (result.success) {
                        statusDiv.innerHTML = `
                            <div style="color: green; font-size: 48px;">✓</div>
                            <p style="color: green; font-weight: bold;">Data submitted successfully!</p>
                            <p style="color: #666; font-size: 14px;">Your data has been saved to DataPipe.</p>
                        `;
                    } else {
                        statusDiv.innerHTML = `
                            <div style="color: orange; font-size: 48px;">⚠</div>
                            <p style="color: orange; font-weight: bold;">Submission failed - data saved locally</p>
                            <p>Error: ${result.error}</p>
                            <p>Your data has been saved and will be submitted when you have an internet connection.</p>
                        `;
                    }
                    
                    button.style.display = 'inline-block';
                    
                } catch (error) {
                    console.error('Error in completion screen:', error);
                    
                    const statusDiv = document.getElementById('submission-status');
                    const button = document.querySelector('.jspsych-btn');
                    
                    statusDiv.innerHTML = `
                        <div style="color: red; font-size: 48px;">✗</div>
                        <p style="color: red; font-weight: bold;">An error occurred</p>
                        <p>Error: ${error.message}</p>
                        <p>Please check the console for more details.</p>
                    `;
                    
                    button.style.display = 'inline-block';
                }
            }
        };
    };
    
})();