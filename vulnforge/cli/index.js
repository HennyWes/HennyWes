const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('vulnforge')
  .description('CLI for configuring and running VulnForge scans')
  .version('1.0.0');

program
  .command('configure')
  .description('Configure a new scan program')
  .action(async () => {
    console.log(chalk.blue('--- VulnForge Configuration ---'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'programName',
        message: 'Enter the HackerOne program name:',
        validate: (input) => input.length > 0 || 'Program name is required',
      },
      {
        type: 'input',
        name: 'scopeUrl',
        message: 'Enter the scope URL (or leave blank to paste rules):',
      },
      {
        type: 'editor',
        name: 'scopeRules',
        message: 'Paste the scope rules here:',
        when: (answers) => !answers.scopeUrl,
      },
      {
        type: 'list',
        name: 'scanDepth',
        message: 'Select scan depth:',
        choices: ['Low', 'Medium', 'High'],
        default: 'Medium',
      },
    ]);

    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir);
    }

    const configPath = path.join(configDir, `${answers.programName.toLowerCase().replace(/\s+/g, '-')}.json`);
    fs.writeFileSync(configPath, JSON.stringify(answers, null, 2));

    console.log(chalk.green(`\nConfiguration saved to ${configPath}`));
    console.log(chalk.yellow('You can now start the scan using: vulnforge scan ' + answers.programName.toLowerCase().replace(/\s+/g, '-')));
  });

program
  .command('scan <config-name>')
  .description('Start a scan using a saved configuration')
  .action((configName) => {
    const configPath = path.join(__dirname, '../config', `${configName}.json`);
    
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red(`Configuration file not found: ${configPath}`));
      process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(chalk.blue(`Starting scan for program: ${config.programName}...`));
    // TODO: Integrate with Python scanner module
    console.log(chalk.yellow('Scanner integration coming soon.'));
  });

program.parse(process.argv);
