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

  // Copy template files
  const templateDir = path.join(__dirname, '../templates/cordova-app');
  await fs.copy(templateDir, targetDir);

  // Update package.json with project name
  const packageJsonPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = projectName;
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
  }

  // Initialize Cordova
  console.log(chalk.blue('Initializing Cordova...'));
  process.chdir(targetDir);
  
  try {
    execSync('cordova create . com.example.' + projectName + ' ' + projectName, { stdio: 'inherit' });
    
    // Add platforms
    console.log(chalk.blue('Adding platforms...'));
    execSync('cordova platform add android', { stdio: 'inherit' });
    execSync('cordova platform add ios', { stdio: 'inherit' });
    
    // Install dependencies
    console.log(chalk.blue('Installing dependencies...'));
    execSync('npm install', { stdio: 'inherit' });
    
  } catch (error) {
    console.error(chalk.red('Error setting up Cordova:'), error);
  }

  console.log(chalk.green('\n✅ Success! Created ' + projectName));
  console.log('\nInside that directory, you can run several commands:');
  console.log(chalk.cyan('  cordova run android'));
  console.log('    Runs the app on Android');
  console.log(chalk.cyan('  cordova run ios'));
  console.log('    Runs the app on iOS');
  console.log('\nWe suggest that you begin by typing:');
  console.log(chalk.cyan('  cd ' + projectName));
  console.log(chalk.cyan('  cordova run android'));
}

module.exports = createApp;