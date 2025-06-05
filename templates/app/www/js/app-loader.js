// Non-module script to handle module loading
(function() {
    // Wait for both deviceready and DOM ready
    var deviceReady = false;
    var domReady = false;
    
    document.addEventListener('deviceready', function() {
        deviceReady = true;
        checkReady();
    }, false);
    
    document.addEventListener('DOMContentLoaded', function() {
        domReady = true;
        checkReady();
    }, false);
    
    function checkReady() {
        if (deviceReady && domReady) {
            loadApp();
        }
    }
    
    function loadApp() {
        // Dynamically import the main module
        import('./index.js').then(function(module) {
            console.log('App module loaded successfully');
        }).catch(function(error) {
            console.error('Failed to load app module:', error);
            // Fallback error display
            document.getElementById('jspsych-target').innerHTML = 
                '<div style="padding: 20px; color: red;">Error loading app: ' + error.message + '</div>';
        });
    }
    
    // If not in Cordova, just wait for DOM
    if (!window.cordova) {
        domReady = true;
        deviceReady = true;
        checkReady();
    }
})();