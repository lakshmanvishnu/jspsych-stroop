import { JsPsych } from 'jspsych';
import jsPsychHtmlKeyboardResponse from '@jspsych/plugin-html-keyboard-response';
import jsPsychHtmlButtonResponse from '@jspsych/plugin-html-button-response';
import jsPsychInstructions from '@jspsych/plugin-instructions';

interface StroopStimulus {
    word: string;
    color: string;
    correct_response: number;
    congruent: boolean;
}
interface TrialData {
    task: string;
    word?: string;
    color?: string;
    correct_response?: number;
    congruent?: boolean;
    correct?: boolean;
    rt?: number;
}
interface StroopState {
    practiceCompleted: boolean;
    mainTrialsCompleted: number;
    totalTrials: number;
}
declare function resetState(): void;
declare function generateStimuli(): StroopStimulus[];
declare function shuffleArray<T>(array: T[]): T[];
declare function createWelcome(): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: string;
    choices: string[];
    post_trial_gap: number;
};
declare function createInstructions(): {
    type: typeof jsPsychInstructions;
    pages: string[];
    show_clickable_nav: boolean;
    button_label_previous: string;
    button_label_next: string;
    button_label_finish: string;
};
declare function createFixation(duration?: {
    min: number;
    max: number;
}): {
    type: typeof jsPsychHtmlKeyboardResponse;
    stimulus: string;
    choices: string;
    trial_duration: () => number;
    data: {
        task: string;
    };
};
declare function createStroopTrial(jsPsych: JsPsych, stimulus: StroopStimulus, isPractice: boolean, trialTimeout?: number): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: string;
    choices: string[];
    button_html: (choice: string, choice_index: number) => string;
    margin_horizontal: string;
    margin_vertical: string;
    trial_duration: number;
    data: {
        task: string;
        word: string;
        color: string;
        correct_response: number;
        congruent: boolean;
    };
    on_finish: (data: any) => void;
};
declare function createPracticeFeedback(jsPsych: JsPsych): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: () => string;
    choices: string[];
    trial_duration: number;
};
declare function createPracticeDebrief(): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: string;
    choices: string[];
    post_trial_gap: number;
    on_finish: () => void;
};
declare function createResults(jsPsych: JsPsych): {
    type: typeof jsPsychHtmlButtonResponse;
    stimulus: () => string;
    choices: string[];
    on_finish: () => void;
};
declare function createTimeline(jsPsych: JsPsych, { practiceTrialsPerCondition, mainTrialsPerCondition, trialTimeout, fixationDuration, showPracticeFeedback, includeFixation, showInstructions, showResults }?: {
    practiceTrialsPerCondition?: number;
    mainTrialsPerCondition?: number;
    trialTimeout?: number;
    fixationDuration?: {
        min: number;
        max: number;
    };
    showPracticeFeedback?: boolean;
    includeFixation?: boolean;
    showInstructions?: boolean;
    showResults?: boolean;
}): any[];
declare const timelineComponents: {
    createWelcome: typeof createWelcome;
    createInstructions: typeof createInstructions;
    createFixation: typeof createFixation;
    createStroopTrial: typeof createStroopTrial;
    createPracticeFeedback: typeof createPracticeFeedback;
    createPracticeDebrief: typeof createPracticeDebrief;
    createResults: typeof createResults;
};
declare const utils: {
    resetState: typeof resetState;
    generateStimuli: typeof generateStimuli;
    shuffleArray: typeof shuffleArray;
};

export { StroopState, StroopStimulus, TrialData, createTimeline, timelineComponents, utils };
