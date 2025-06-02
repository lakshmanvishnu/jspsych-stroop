const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');

async function createApp(projectName, options) {
  const targetDir = path.join(process.cwd(), projectName);
  
  // Check if directory exists
  if (fs.existsSync(targetDir)) {
    console.error(chalk.red(`Directory ${projectName} already exists!`));
    process.exit(1);
  }

  console.log(chalk.blue(`Creating a new jsPsych Cordova app in ${targetDir}`));

  try {
    // Create the project directory
    fs.mkdirSync(targetDir);
    process.chdir(targetDir);
    
    // Initialize npm project
    console.log(chalk.blue('Initializing npm project...'));
    execSync('npm init -y', { stdio: 'inherit' });
    
    // Install Cordova as a local dependency
    console.log(chalk.blue('Installing Cordova locally...'));
    execSync('npm install cordova --save-dev', { stdio: 'inherit' });
    
    // Create a basic Cordova project structure
    console.log(chalk.blue('Creating Cordova project structure...'));
    
    // Instead of using 'cordova create', we'll set up the structure manually
    // This avoids the issue of Cordova overwriting our files
    
    // Create necessary directories
    fs.mkdirSync('www');
    fs.mkdirSync('platforms');
    fs.mkdirSync('plugins');
    
    // Copy template files
    console.log(chalk.blue('Applying jsPsych template...'));
    const templateDir = path.join(__dirname, '../templates/app');
    
    // Copy www folder contents
    const templateWww = path.join(templateDir, 'www');
    if (fs.existsSync(templateWww)) {
      await fs.copy(templateWww, path.join(targetDir, 'www'), { overwrite: true });
    }
    
    // Create experiments folder structure in www/js
    const experimentsDir = path.join(targetDir, 'www/js/experiments');
    fs.mkdirSync(experimentsDir, { recursive: true });
    
    // Create a sample experiment
    const sampleExperimentDir = path.join(experimentsDir, 'sample-experiment');
    fs.mkdirSync(sampleExperimentDir);
    
    // Create sample experiment file
    const sampleExperimentContent = `// Sample experiment
export function run(jsPsych) {
  const timeline = [];
  
  const welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<h2>Sample Experiment</h2><p>Press any key to continue.</p>'
  };
  timeline.push(welcome);
  
  const trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p>This is a sample trial. Press any key to end.</p>'
  };
  timeline.push(trial);
  
  return timeline;
}`;
    
    fs.writeFileSync(path.join(sampleExperimentDir, 'index.js'), sampleExperimentContent);
    
    // Update the main index.js to use the experiments structure
    const mainIndexContent = `// Main experiment runner
import { run as runSampleExperiment } from './experiments/sample-experiment/index.js';

document.addEventListener('deviceready', onDeviceReady, false);

if (!window.cordova) {
    onDeviceReady();
}

function onDeviceReady() {
    const jsPsych = initJsPsych({
        on_finish: function() {
            jsPsych.data.displayData();
        }
    });

    // Combine all experiments
    const timeline = [];
    
    // Add experiments here
    timeline.push(...runSampleExperiment(jsPsych));
    
    // Run the combined timeline
    jsPsych.run(timeline);
}`;

    fs.writeFileSync(path.join(targetDir, 'www/js/index.js'), mainIndexContent);
    
    // Copy config.xml
    const templateConfig = path.join(templateDir, 'config.xml');
    if (fs.existsSync(templateConfig)) {
      await fs.copy(templateConfig, path.join(targetDir, 'config.xml'));
    } else {
      // Create a default config.xml if template doesn't exist
      const defaultConfig = `<?xml version='1.0' encoding='utf-8'?>
<widget id="com.example.${projectName.replace(/[^a-zA-Z0-9]/g, '')}" version="1.0.0" xmlns="http://www.w3.org/ns/widgets" xmlns:cdv="http://cordova.apache.org/ns/1.0">
    <name>${projectName}</name>
    <description>A jsPsych experiment app</description>
    <author email="dev@example.com" href="http://example.com">
        jsPsych Developer
    </author>
    <content src="index.html" />
    <allow-intent href="http://*/*" />
    <allow-intent href="https://*/*" />
    <preference name="DisallowOverscroll" value="true" />
    <preference name="android-minSdkVersion" value="22" />
    <platform name="android">
        <preference name="android-compileSdkVersion" value="35" />
        <preference name="android-targetSdkVersion" value="34" />
    </platform>
</widget>`;
      fs.writeFileSync('config.xml', defaultConfig);
    }
    
    // Update package.json with scripts and dependencies
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    
    packageJson.name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    packageJson.displayName = projectName;
    packageJson.description = 'A jsPsych experiment app built with Cordova';
    
    // Add Cordova-specific scripts using npx
    packageJson.scripts = {
      ...packageJson.scripts,
      'cordova': 'cordova',
      'serve': 'cordova serve',
      'android': 'cordova run android',
      'ios': 'cordova run ios',
      'build-android': 'cordova build android',
      'build-ios': 'cordova build ios',
      'platform-add-android': 'cordova platform add android',
      'platform-add-ios': 'cordova platform add ios',
      'requirements': 'cordova requirements'
    };
    
    // Add cordova to devDependencies if not already there
    packageJson.devDependencies = packageJson.devDependencies || {};
    packageJson.devDependencies.cordova = packageJson.devDependencies.cordova || '^12.0.0';
    
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    
    // Add platforms
    console.log(chalk.blue('\nAdding platforms...'));
    console.log(chalk.yellow('Note: Platform requirements must be met for each platform'));
    
    // Try to add Android
    try {
      console.log(chalk.blue('Adding Android platform...'));
      execSync('npx cordova platform add android', { stdio: 'inherit' });
      console.log(chalk.green('✓ Android platform added'));
    } catch (error) {
      console.log(chalk.yellow('⚠ Could not add Android platform.'));
      console.log(chalk.yellow('  You can add it later with: npm run platform-add-android'));
    }
    
    // Try to add iOS (only on macOS)
    if (process.platform === 'darwin') {
      try {
        console.log(chalk.blue('Adding iOS platform...'));
        execSync('npx cordova platform add ios', { stdio: 'inherit' });
        console.log(chalk.green('✓ iOS platform added'));
      } catch (error) {
        console.log(chalk.yellow('⚠ Could not add iOS platform.'));
        console.log(chalk.yellow('  You can add it later with: npm run platform-add-ios'));
      }
    }
    
    console.log(chalk.green('\nSuccess! Created ' + projectName));
    console.log('\nYour app structure:');
    console.log('  www/js/experiments/ - Place your experiment folders here');
    console.log('  www/js/index.js - Main file that stitches experiments together');
    
    console.log('\nTo add a new experiment:');
    console.log('  1. Create a folder in www/js/experiments/');
    console.log('  2. Add an index.js that exports a run(jsPsych) function');
    console.log('  3. Import and add it to www/js/index.js');
    
    console.log('\nAvailable commands:');
    console.log(chalk.cyan('  npm run serve'));
    console.log('    Serves the app in a browser for testing');
    console.log(chalk.cyan('  npm run android'));
    console.log('    Runs the app on Android (requires Android SDK)');
    if (process.platform === 'darwin') {
      console.log(chalk.cyan('  npm run ios'));
      console.log('    Runs the app on iOS (requires Xcode)');
    }
    console.log(chalk.cyan('  npm run requirements'));
    console.log('    Check if your system meets platform requirements');
    
    console.log('\nWe suggest that you begin by typing:');
    console.log(chalk.cyan('  cd ' + projectName));
    console.log(chalk.cyan('  npm run serve'));
    
    // Platform setup instructions
    console.log(chalk.yellow('\nPlatform Setup:'));
    console.log('If platforms were not added automatically, you can add them with:');
    console.log(chalk.cyan('  npm run platform-add-android'));
    if (process.platform === 'darwin') {
      console.log(chalk.cyan('  npm run platform-add-ios'));
    }
    
    console.log('\nFor Android development, you need:');
    console.log('  - Android Studio with Android SDK');
    console.log('  - Java JDK 11 or higher');
    console.log('  - Set ANDROID_HOME environment variable');
    
    if (process.platform === 'darwin') {
      console.log('\nFor iOS development, you need:');
      console.log('  - Xcode (from Mac App Store)');
      console.log('  - Xcode Command Line Tools');
    }
    
  } catch (error) {
    console.error(chalk.red('\n⚠ Error creating app:'), error.message);
    
    // Clean up if we created the directory
    if (fs.existsSync(targetDir)) {
      console.log(chalk.yellow('\nCleaning up...'));
      process.chdir('..');
      fs.removeSync(targetDir);
    }
    
    process.exit(1);
  }
}

module.exports = createApp;