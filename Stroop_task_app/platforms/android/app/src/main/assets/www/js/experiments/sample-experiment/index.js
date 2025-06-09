// Sample experiment - self-registering version
(function() {
   
    function run(jsPsych) {
        const timeline = [];
       
        const welcome = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<h2>Sample Experiment</h2><p>Click the button to continue.</p>',
            choices: ['Continue']
        };
        timeline.push(welcome);
       
        const trial = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>This is a sample trial. Click the button to end.</p>',
            choices: ['Next']
        };
        timeline.push(trial);
       
        return timeline;
    }
   
    // Register this experiment
    if (window.ExperimentLoader) {
        window.ExperimentLoader.register('sample-experiment', {
            run: run
        });
    }
   
})();