#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const program = new Command();

program
  .name('vulnforge')
  .description('CLI for configuring and running VulnForge scans')
  .version('1.0.0');

const CONFIG_DIR = path.join(__dirname, '../config');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

program
  .command('init')
  .description('Initialize a new scan program configuration')
  .option('-f, --file <path>', 'Path to a JSON or YAML config file to import')
  .action(async (options) => {
    ensureConfigDir();
    
    let configData;

    if (options.file) {
      const filePath = path.resolve(options.file);
      if (!fs.existsSync(filePath)) {
        console.error(chalk.red(`File not found: ${filePath}`));
        process.exit(1);
      }

      const ext = path.extname(filePath).toLowerCase();
      const content = fs.readFileSync(filePath, 'utf-8');

      try {
        if (ext === '.json') {
          configData = JSON.parse(content);
        } else if (ext === '.yaml' || ext === '.yml') {
          configData = yaml.load(content);
        } else {
          console.error(chalk.red('Unsupported file format. Use .json or .yaml'));
          process.exit(1);
        }
      } catch (e) {
        console.error(chalk.red(`Error parsing file: ${e.message}`));
        process.exit(1);
      }

      if (!configData.programName) {
        console.error(chalk.red('Config file must contain "programName"'));
        process.exit(1);
      }
    } else {
      console.log(chalk.blue('--- VulnForge Program Initialization ---'));
      configData = await inquirer.prompt([
        {
          type: 'input',
          name: 'programName',
          message: 'Enter the HackerOne program name:',
          validate: (input) => input.length > 0 || 'Program name is required',
        },
        {
          type: 'input',
          name: 'scopeUrl',
          message: 'Enter the scope URL (optional):',
        },
        {
          type: 'editor',
          name: 'scopeRules',
          message: 'Paste the scope rules (JSON format preferred):',
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
    }

    const configFileName = `${configData.programName.toLowerCase().replace(/\s+/g, '-')}.json`;
    const configPath = path.join(CONFIG_DIR, configFileName);
    
    fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));

    console.log(chalk.green(`\nConfiguration saved to ${configPath}`));
    console.log(chalk.yellow(`You can now start the scan using: vulnforge scan --config ${configFileName}`));
  });

program
  .command('scan')
  .description('Start a scan using a saved configuration')
  .requiredOption('-c, --config <file>', 'Configuration file name (in config/ directory)')
  .action((options) => {
    const configPath = path.join(CONFIG_DIR, options.config);
    
    if (!fs.existsSync(configPath)) {
      console.error(chalk.red(`Configuration file not found: ${configPath}`));
      process.exit(1);
    }

    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log(chalk.blue(`Starting scan for program: ${chalk.bold(config.programName)}...`));
      console.log(chalk.gray(`Scan Depth: ${config.scanDepth}`));
      
      // Scanner integration placeholder
      console.log(chalk.yellow('\n[STUB] Handing off to Python scanner engine...'));
      console.log(chalk.yellow('[STUB] Running scope parser...'));
      console.log(chalk.yellow('[STUB] Enumerating targets...'));
      
      console.log(chalk.green('\nScan pipeline initialized successfully.'));
    } catch (e) {
      console.error(chalk.red(`Error reading configuration: ${e.message}`));
      process.exit(1);
    }
  });

program.parse(process.argv);
