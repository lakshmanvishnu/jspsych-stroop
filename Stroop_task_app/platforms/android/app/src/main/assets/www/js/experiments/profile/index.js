// Profile experiment - self-registering version
(function() {
   
    // Define the experiment
    function run(jsPsych) {
        // Generate a random UUID in XXXX-XXXX-XXXX-XXXX format
        function generateUUID() {
            const chars = '0123456789ABCDEF';
            let uuid = '';
            for (let i = 0; i < 4; i++) {
                if (i > 0) uuid += '-';
                for (let j = 0; j < 4; j++) {
                    uuid += chars[Math.floor(Math.random() * 16)];
                }
            }
            return uuid;
        }

        const timeline = [];

        // Custom HTML form for profile input
        const profileForm = {
            type: jsPsychSurveyHtmlForm,
            preamble: `
                <h2>Welcome!</h2>
                <p>Please enter your User ID or leave blank to generate one automatically.</p>
            `,
            html: `
                <div style="margin: 20px 0;">
                    <label for="userId" style="display: block; margin-bottom: 10px; font-weight: bold;">
                        User ID:
                    </label>
                    <input
                        type="text"
                        id="userId"
                        name="userId"
                        placeholder="Enter ID or leave blank"
                        style="width: 100%; padding: 10px; font-size: 16px; border: 2px solid #ccc; border-radius: 4px;"
                        pattern="[A-Za-z0-9-]+"
                        title="Please use only letters, numbers, and hyphens"
                    >
                    <p style="font-size: 14px; color: #666; margin-top: 5px;">
                        Format: XXXX-XXXX-XXXX-XXXX (will be generated if left blank)
                    </p>
                </div>
            `,
            button_label: 'Continue',
            on_finish: function(data) {
                let userId = data.response.userId.trim();
                if (!userId) {
                    userId = generateUUID();
                    console.log('Generated new User ID:', userId);
                } else {
                    console.log('User entered ID:', userId);
                }
               
                jsPsych.data.addProperties({
                    userId: userId,
                    profileCompleted: true
                });
               
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('jspsych_userId', userId);
                }
            }
        };

        const welcomeMessage = {
            type: jsPsychHtmlButtonResponse,
            stimulus: function() {
                const userId = jsPsych.data.get().filter({profileCompleted: true}).values()[0].userId;
                return `
                    <h2>Profile Created!</h2>
                    <p>Your User ID is:</p>
                    <p style="font-size: 24px; font-weight: bold; color: #007bff; font-family: monospace;">
                        ${userId}
                    </p>
                    <p>This ID has been saved to your device.</p>
                    <p>Press the button below to continue to the experiment.</p>
                `;
            },
            choices: ['Continue']
        };

        timeline.push(profileForm);
        timeline.push(welcomeMessage);

        return timeline;
    }
   
    // Check if user has an ID
    function checkUserId() {
        return new Promise((resolve) => {
            if (typeof localStorage !== 'undefined') {
                const userId = localStorage.getItem('jspsych_userId');
                resolve(userId);
            } else {
                resolve(null);
            }
        });
    }
   
    // Register this experiment
    if (window.ExperimentLoader) {
        window.ExperimentLoader.register('profile', {
            run: run,
            checkUserId: checkUserId
        });
    }
   
})();