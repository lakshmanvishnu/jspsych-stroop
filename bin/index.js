#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const createApp = require('../lib/create-app');

program
  .version('1.0.0')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <template>', 'Template to use', 'default')
  .action(async (projectName, options) => {
    if (!projectName) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'What is your project name?',
          default: 'new-jspsych-app'
        }
      ]);
      projectName = answers.projectName;
    }

    await createApp(projectName, options);
  });

program.parse();