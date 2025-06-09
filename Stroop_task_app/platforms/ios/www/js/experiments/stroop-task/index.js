// Stroop experiment
const jsPsych = initJsPsych({
    override_safe_mode: true,  // 👈 necessary for running locally or in Cordova
    on_finish: function () {
        jsPsych.data.displayData(); // or whatever you want to happen at the end
    }
});
  
(function() {

    function run(jsPsych) {

        const test_stimuli = [
            {
                word: "RED",
                color: "red",
                correct_response: 0,
                congruent: true
            },
            {
                word: "RED",
                color: "blue",
                correct_response: 2,
                congruent: false
            },
            {
                word: "RED",
                color: "yellow",
                correct_response: 3,
                congruent: false
            },
            {
                word: "RED",
                color: "green",
                correct_response: 1,
                congruent: false
            },
            {
                word: "GREEN",
                color: "red",
                correct_response: 0,
                congruent: false
            },
            {
                word: "GREEN",
                color: "blue",
                correct_response: 2,
                congruent: false
            },
            {
                word: "GREEN",
                color: "yellow",
                correct_response: 3,
                congruent: false
            },
            {
                word: "GREEN",
                color: "green",
                correct_response: 3,
                congruent: true
            },
            {
                word: "BLUE",
                color: "red",
                correct_response: 0,
                congruent: false
            },
            {
                word: "BLUE",
                color: "blue",
                correct_response: 2,
                congruent: true
            },
            {
                word: "BLUE",
                color: "yellow",
                correct_response: 3,
                congruent: false
            },
            {
                word: "BLUE",
                color: "green",
                correct_response: 1,
                congruent: false
            },
            {
                word: "YELLOW",
                color: "red",
                correct_response: 0,
                congruent: false
            },
            {
                word: "YELLOW",
                color: "blue",
                correct_response: 2,
                congruent: false
            },
            {
                word: "YELLOW",
                color: "yellow",
                correct_response: 3,
                congruent: true
            },
            {
                word: "YELLOW",
                color: "green",
                correct_response: 1,
                congruent: false
            }
        ];

        const COLORS_DATA = [
            { name: 'RED', hex: 'red', key: 'r' },
            { name: 'GREEN', hex: 'green', key: 'g' },
            { name: 'BLUE', hex: 'blue', key: 'b' },
            { name: 'YELLOW', hex: 'yellow', key: 'y' }
        ];

        const FIXATION_MIN_DURATION = 300; // ms
        const FIXATION_MAX_DURATION = 1000; // ms

        const timeline = [];

        //Welcome screen
        const welcome = {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <h1>Welcome to the Stroop Task!</h1>
                <p> In this experiment, you will see words printed in different colors.</p>
                <p>Your task is to identify the <strong>color of the ink</strong> the word is printed in, NOT the word itself.</p>
                <p>Please respond as quickly and accurately as possible.</p>
                <p>Press any key to continue to the instructions.</p>
                `,
                choices: ['Continue']
        };
        timeline.push(welcome);

        let instructions_js = `
          <div class="instructions-container">
            <h2>Instructions</h2>
            <p>You will see a word (e.g., "RED", "BLUE") displayed in one of four ink colors: red, green, blue, or yellow.</p>
            <p>Your task is to tap the button corresponding to the <strong>INK COLOR</strong> of the word, ignoring what the word says.</p>
            <p>Tap the colored buttons that will appear below each word:</p>
            <div class="color-example-container">
        `;

        COLORS_DATA.forEach(color => {
            instructions_js += `
                <div class="color-example">
                  <span style="color:${color.hex};">${color.name}</span>
                  Press <span class="key-mapping">'${color.key.toUpperCase()}'</span>
                </div>
        `;
        });

        instructions_js += `
            </div>
            <p>For example, if you see the word <strong style="color:blue;">RED</strong> (written in BLUE ink), you should tap the BLUE button.</p>
            <p>If you see the word <strong style="color:green;">GREEN</strong> (written in GREEN ink), you should tap the GREEN button.</p>
            <p>There will be a short practice session first.</p>
            <p>Press any key to begin the practice.</p>
          </div>
        `;

        const instructions = {
            type: jsPsychHtmlButtonResponse,
            stimulus: instructions_js,
            choices: ['Begin Practice'],
            post_trial_gap: 500
        };
        timeline.push(instructions);

        const fixation = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: '<div style="font-size:60px;">+</div>',
            choices: "NO_KEYS",
            trial_duration: function () {
                return jsPsych.randomization.randomInt(FIXATION_MIN_DURATION, FIXATION_MAX_DURATION);
            },
            data: {
                task: 'fixation'
            }
        };
        timeline.push(fixation);
        
        // Practice trials
        const practice_trial_1 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<div style="font-size: 48px; color: red; font-weight: bold;">RED</div>',
            choices: ['RED', 'GREEN', 'BLUE', 'YELLOW'],
            button_html: (choice) => `<div style="border: 3px solid #333; width: 150px; height: 60px; margin: 50px 20px 20px 20px; background-color: ${choice}; border-radius: 8px; cursor: pointer;">${choice}</div>`,
            grid_rows: 2,
            grid_columns: 2,
            data: {task: 'practice', correct_response: 0, word: 'RED', color: 'red'},
            on_finish: function (data) {
                data.correct = (data.response === data.correct_response);
            }
        };

        const practice_feedback_1 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {
                const last_trial = jsPsych.data.get().last(1).values()[0];
                if (last_trial.correct) {
                    return '<div style="font-size: 24px; color: green;"><p>✓ CORRECT! Press any key to continue.</p></div>';
                } else {
                    return '<div style="font-size: 24px; color: red;"><p>✗ INCORRECT. The correct key was R for RED ink. Press any key to continue.</p></div>';
                }
            },
            choices: ['Continue']
        };

        const practice_trial_2 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<div style="font-size: 48px; color: blue; font-weight: bold;">BLUE</div>',
            choices: ['RED', 'GREEN', 'BLUE', 'YELLOW'],
            button_html: (choice) => `<div style="border: 3px solid #333; width: 150px; height: 60px; margin: 50px 20px 20px 20px; background-color: ${choice}; border-radius: 8px; cursor: pointer;">${choice}</div>`,
            grid_rows: 2,
            grid_columns: 2,
            data: { task: 'practice', correct_response: 2, word: 'BLUE', color: 'blue' },
            on_finish: function (data) {
                data.correct = (data.response === data.correct_response);
            }
        };
        
        const practice_feedback_2 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {
                const last_trial = jsPsych.data.get().last(1).values()[0];
                if (last_trial.correct) {
                    return '<div style="font-size: 24px; color: green;"><p>✓ CORRECT! Press any key to continue.</p></div>';
                } else {
                    return '<div style="font-size: 24px; color: red;"><p>✗ INCORRECT. The correct key was R for RED ink. Press any key to continue.</p></div>';
                }
            },
            choices: ['Continue']
        };

        const practice_trial_3 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<div style="font-size: 48px; color: yellow; font-weight: bold;">RED</div>',
            choices: ['RED', 'GREEN', 'BLUE', 'YELLOW'],
            button_html: (choice) => `<div style="border: 3px solid #333; width: 150px; height: 60px; margin: 50px 20px 20px 20px; background-color: ${choice}; border-radius: 8px; cursor: pointer;">${choice}</div>`,
            grid_rows: 2,
            grid_columns: 2,
            data: { task: 'practice', correct_response: 3, word: 'RED', color: 'yellow' },
            on_finish: function (data) {
                data.correct = (data.response === data.correct_response);
            }
        };

        const practice_feedback_3 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {
                const last_trial = jsPsych.data.get().last(1).values()[0];
                if (last_trial.correct) {
                    return '<div style="font-size: 24px; color: green;"><p>✓ CORRECT! Press any key to continue.</p></div>';
                } else {
                    return '<div style="font-size: 24px; color: red;"><p>✗ INCORRECT. The correct key was R for RED ink. Press any key to continue.</p></div>';
                }
            },
            choices: ['Continue']
        };

        const practice_trial_4 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: '<div style="font-size: 48px; color: green; font-weight: bold;">YELLOW</div>',
            choices: ['RED', 'GREEN', 'BLUE', 'YELLOW'],
            button_html: (choice) => `<div style="border: 3px solid #333; width: 150px; height: 60px; margin: 50px 20px 20px 20px; background-color: ${choice}; border-radius: 8px; cursor: pointer;">${choice}</div>`,
            grid_rows: 2,
            grid_columns: 2,
            data: { task: 'practice', correct_response: 1, word: 'YELLOW', color: 'green' },
            on_finish: function (data) {
                data.correct = (data.response === data.correct_response);
            }
        };

        const practice_feedback_4 = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {
                const last_trial = jsPsych.data.get().last(1).values()[0];
                if (last_trial.correct) {
                    return '<div style="font-size: 24px; color: green;"><p>✓ CORRECT! Press any key to continue.</p></div>';
                } else {
                    return '<div style="font-size: 24px; color: red;"><p>✗ INCORRECT. The correct key was R for RED ink. Press any key to continue.</p></div>';
                }
            },
            choices: ['Continue']
        };
        timeline.push(practice_trial_1);
        timeline.push(practice_feedback_1);
        timeline.push(practice_trial_2);
        timeline.push(practice_feedback_2);
        timeline.push(practice_trial_3);
        timeline.push(practice_feedback_3);
        timeline.push(practice_trial_4);
        timeline.push(practice_feedback_4);

        // Main trials
        const practice_debrief = {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                    <div class="instructions-container">
                        <h2>Practice Complete!</h2>
                        <p>Great job! You've finished the practice trials.</p>
                        <p>Now you'll begin the main experiment.</p>
                        <p>Remember:</p>
                        <ul>
                            <li>Respond to the <strong>ink color</strong>, not the word</li>
                            <li>Be as fast and accurate as possible</li>
                            <li>Tap the colored buttons for Red, Green, Blue, Yellow</li>
                        </ul>
                        <p>Press any key to start the main experiment.</p>
                    </div>
                `,
            choices: ['Start Experiment'],
            post_trial_gap: 500
        };
        timeline.push(practice_debrief);

        // --- Trial Generation Functions ---
        const test = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {
                const word = jsPsych.evaluateTimelineVariable('word');
                const color = jsPsych.evaluateTimelineVariable('color');
                return `<div style="font-size: 48px; color: ${color}; font-weight: bold;">${word}</div>`;
            },
            choices: ['RED', 'GREEN', 'BLUE', 'YELLOW'], // or whatever keys you want to use
            button_html: (choice) => `<div style="border: 3px solid #333; width: 150px; height: 60px; margin: 20px; background-color: ${choice}; border-radius: 8px; cursor: pointer;">${choice}</div>`,
            grid_rows: 2,
            grid_columns: 2,
            data: {
                task: 'response',
                word: jsPsych.timelineVariable('word'),
                color: jsPsych.timelineVariable('color'),
                correct_response: jsPsych.timelineVariable('correct_response'),
                congruent: jsPsych.timelineVariable('congruent')
            },
            on_finish: function (data) {
                data.correct = (data.response === data.correct_response);
            }
        };

        // --- Main Trials ---
        const test_procedure = {
            timeline: [fixation, test], // Include fixation if desired
            timeline_variables: test_stimuli,
            sample: {
                type: 'with-replacement',
                size: 6
            },
        };
        timeline.push(test_procedure);

        // --- Debrief Function ---
        var debrief_block = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function () {

                var trials = jsPsych.data.get().filter({ task: 'response' });
                var correct_trials = trials.filter({ correct: true });

                // Check if we have data
                if (trials.count() === 0) {
                    return `<p>No trial data found. Press any key to see raw data.</p>`;
                }

                var congruent_trials = trials.filter({ congruent: true });
                var incongruent_trials = trials.filter({ congruent: false });

                var congruent_correct = congruent_trials.filter({ correct: true });
                var incongruent_correct = incongruent_trials.filter({ correct: true });

                var congruent_accuracy = congruent_trials.count() > 0 ? Math.round(congruent_correct.count() / congruent_trials.count() * 100) : 0;
                var incongruent_accuracy = incongruent_trials.count() > 0 ? Math.round(incongruent_correct.count() / incongruent_trials.count() * 100) : 0;

                var congruent_rt = congruent_correct.count() > 0 ? Math.round(congruent_correct.select('rt').mean()) : 0;
                var incongruent_rt = incongruent_correct.count() > 0 ? Math.round(incongruent_correct.select('rt').mean()) : 0;

                var stroop_effect = incongruent_rt - congruent_rt;

                return `
                    <div style="text-align: center;">
                        <h2>Experiment Complete!</h2>
                        <p><strong>Congruent trials:</strong> ${congruent_accuracy}% correct, ${congruent_rt}ms average</p>
                        <p><strong>Incongruent trials:</strong> ${incongruent_accuracy}% correct, ${incongruent_rt}ms average</p>
                        <p><strong>Stroop Effect:</strong> ${stroop_effect}ms</p>
                        <br>
                        <p>Press any key to see raw data. Thank you!</p>
                    </div>
                `;
                        },
                choices: ['See Raw Data'],
        };
        timeline.push(debrief_block);

        return timeline;
    }
    
    console.log("Registering stroop-task experiment...");

    // Register the experiment
    if (window.ExperimentLoader) {
      window.ExperimentLoader.register('stroop-task', {
        run: run
      });
    }
})();