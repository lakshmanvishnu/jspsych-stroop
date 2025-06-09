// experiment-loader.js - Dynamic experiment loader that works on iOS
window.ExperimentLoader = (function() {
   
    // Registry for experiments
    const experiments = {};
   
    // Register an experiment
    function register(name, experimentModule) {
        console.log('Registering experiment:', name);
        experiments[name] = experimentModule;
    }
   
    // Get an experiment
    function get(name) {
        return experiments[name];
    }
   
    // Get all registered experiments
    function getAll() {
        return experiments;
    }
   
    // Load an experiment script dynamically
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
   
    // Load all experiments from a manifest
    async function loadExperiments(experimentList) {
        console.log('Loading experiments:', experimentList);
       
        for (const expName of experimentList) {
            try {
                await loadScript(`js/experiments/${expName}/index.js`);
                console.log(`Loaded experiment: ${expName}`);
            } catch (error) {
                console.error(`Failed to load experiment ${expName}:`, error);
            }
        }
       
        return experiments;
    }
   
    return {
        register,
        get,
        getAll,
        loadScript,
        loadExperiments
    };
})();