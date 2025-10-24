#!/usr/bin/env node

require('dotenv').config({ silent: true });
const { program } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { SplineEditor } = require('./spline-editor');
const { SplineFetcher } = require('./spline-fetcher');

// Package info
const packageJson = require('../package.json');

// Initialize Spline Editor
const splineEditor = new SplineEditor();

// Configure CLI program
program
  .name('spline-edit')
  .description('CLI tool for editing inside Spline')
  .version(packageJson.version);

// Connect command - authenticate with Spline
program
  .command('connect')
  .description('Connect to your Spline account')
  .option('-t, --token <token>', 'API token for authentication')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔌 Connecting to Spline...'));

      let token = options.token;

      // Check if .env credentials are available
      if (!token && process.env.SPLINE_EMAIL && process.env.SPLINE_PASSWORD) {
        console.log(chalk.gray(`Using credentials from .env for ${process.env.SPLINE_EMAIL}...`));
      } else if (!token) {
        const answers = await inquirer.prompt([
          {
            type: 'password',
            name: 'token',
            message: 'Enter your Spline API token:',
            mask: '*'
          }
        ]);
        token = answers.token;
      }

      const result = await splineEditor.connect(token);
      if (result.success) {
        console.log(chalk.green('✅ Successfully connected to Spline!'));
        console.log(`Welcome, ${result.user.name}!`);
        console.log(`Email: ${chalk.cyan(result.user.email)}`);
      } else {
        console.log(chalk.red('❌ Failed to connect to Spline'));
        console.log(chalk.red(result.error));
      }
    } catch (error) {
      console.error(chalk.red('❌ Connection failed:'), error.message);
    }
  });

// List projects command
program
  .command('projects')
  .alias('ls')
  .description('List your Spline projects')
  .option('-f, --format <format>', 'Output format (table|json)', 'table')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📋 Fetching your Spline projects...'));
      
      const projects = await splineEditor.listProjects();
      
      if (options.format === 'json') {
        console.log(JSON.stringify(projects, null, 2));
      } else {
        console.log('\n' + chalk.bold('Your Spline Projects:'));
        console.log(chalk.gray('─'.repeat(60)));
        
        projects.forEach((project, index) => {
          console.log(`${index + 1}. ${chalk.cyan(project.name)}`);
          console.log(`   ID: ${chalk.gray(project.id)}`);
          console.log(`   Modified: ${chalk.yellow(project.lastModified)}`);
          console.log(`   URL: ${chalk.blue(project.url)}\n`);
        });
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to fetch projects:'), error.message);
    }
  });

// Open project command
program
  .command('open <project>')
  .description('Open a Spline project for editing')
  .option('-i, --interactive', 'Interactive mode for project selection')
  .option('-b, --browser', 'Open project in web browser')
  .action(async (project, options) => {
    try {
      if (options.interactive) {
        const projects = await splineEditor.listProjects();
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedProject',
            message: 'Select a project to open:',
            choices: projects.map(p => ({
              name: `${p.name} (${p.id})`,
              value: p.id
            }))
          }
        ]);
        project = answers.selectedProject;
      }

      console.log(chalk.blue(`🚀 Opening Spline project: ${project}`));

      const result = await splineEditor.openProject(project);
      if (result.success) {
        console.log(chalk.green('✅ Project opened successfully!'));
        console.log(`Project: ${chalk.cyan(result.project.name)}`);
        console.log(`Objects: ${chalk.yellow(result.project.objectCount)}`);

        // Open in browser if requested
        if (options.browser) {
          const url = `https://app.spline.design/file/${project}`;
          console.log(chalk.blue(`\n🌐 Opening in browser: ${url}`));
          const open = require('child_process').exec;
          const platform = process.platform;
          const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
          open(`${cmd} ${url}`);
        }
      } else {
        console.log(chalk.red('❌ Failed to open project'));
        console.log(chalk.red(result.error));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to open project:'), error.message);
    }
  });

// Edit object command
program
  .command('edit <objectId>')
  .description('Edit a specific object in the current project')
  .option('-p, --property <property>', 'Property to edit (position|rotation|scale|material)')
  .option('-v, --value <value>', 'New value for the property')
  .action(async (objectId, options) => {
    try {
      console.log(chalk.blue(`✏️  Editing object: ${objectId}`));
      
      if (!options.property || !options.value) {
        const answers = await inquirer.prompt([
          {
            type: 'list',
            name: 'property',
            message: 'What property do you want to edit?',
            choices: ['position', 'rotation', 'scale', 'material', 'visibility'],
            when: !options.property
          },
          {
            type: 'input',
            name: 'value',
            message: 'Enter the new value:',
            when: !options.value
          }
        ]);
        
        options.property = options.property || answers.property;
        options.value = options.value || answers.value;
      }
      
      const result = await splineEditor.editObject(objectId, options.property, options.value);
      if (result.success) {
        console.log(chalk.green('✅ Object updated successfully!'));
        console.log(`${chalk.cyan(options.property)}: ${chalk.yellow(options.value)}`);
      } else {
        console.log(chalk.red('❌ Failed to update object'));
        console.log(chalk.red(result.error));
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to edit object:'), error.message);
    }
  });

// Export command
program
  .command('export <format>')
  .description('Export current project in specified format')
  .option('-o, --output <path>', 'Output file path')
  .option('-q, --quality <quality>', 'Export quality (low|medium|high)', 'medium')
  .action(async (format, options) => {
    try {
      console.log(chalk.blue(`📦 Exporting project as ${format.toUpperCase()}...`));
      
      const result = await splineEditor.exportProject(format, {
        outputPath: options.output,
        quality: options.quality
      });
      
      if (result.success) {
        console.log(chalk.green('✅ Export completed!'));
        console.log(`File saved: ${chalk.cyan(result.outputPath)}`);
        console.log(`Size: ${chalk.yellow(result.fileSize)}`);
      } else {
        console.log(chalk.red('❌ Export failed'));
        console.log(chalk.red(result.error));
      }
    } catch (error) {
      console.error(chalk.red('❌ Export failed:'), error.message);
    }
  });

// Workflow Builder command - Visual workflow automation builder
program
  .command('workflow')
  .description('🎨 Open visual workflow builder (drag-and-drop automation)')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('--no-browser', 'Don\'t auto-open browser')
  .action(async (options) => {
    try {
      const express = require('express');

      const app = express();
      const port = options.port;

      // Serve workflow builder files
      app.use(express.static(path.join(__dirname, '../workflow-builder')));

      const server = app.listen(port, async () => {
        console.log(chalk.green('✅ Workflow Builder started!'));
        console.log('');
        console.log(chalk.cyan(`🎨 Builder: http://localhost:${port}`));
        console.log(chalk.gray('📋 Viewer API: http://localhost:8080'));
        console.log('');
        console.log(chalk.yellow('💡 Usage:'));
        console.log(chalk.gray('   1. Drag nodes from sidebar to canvas'));
        console.log(chalk.gray('   2. Configure node inputs'));
        console.log(chalk.gray('   3. Click "Run Workflow" to execute'));
        console.log(chalk.gray('   4. Save workflows for later use'));
        console.log('');
        console.log(chalk.gray('Press Ctrl+C to stop'));

        if (options.browser !== false) {
          try {
            const open = (await import('open')).default;
            await open(`http://localhost:${port}`);
          } catch (error) {
            console.log(chalk.gray('\n💡 Open manually: http://localhost:' + port));
          }
        }
      });

      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n👋 Closing workflow builder...'));
        server.close();
        process.exit(0);
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to start workflow builder:'), error.message);
    }
  });

// Enhanced Workflow Builder V2 - With node connections and sim.ai integration
program
  .command('workflow-pro')
  .alias('wf-pro')
  .description('⚡ Enhanced workflow builder with visual connections & sim.ai integration')
  .option('-p, --port <port>', 'Server port', '3001')
  .option('--no-browser', 'Don\'t auto-open browser')
  .action(async (options) => {
    try {
      const express = require('express');

      const app = express();
      const port = options.port;

      // Serve enhanced workflow builder files
      app.use(express.static(path.join(__dirname, '../workflow-builder-v2')));

      const server = app.listen(port, () => {
        console.log(chalk.green('✅ Enhanced Workflow Builder started!'));
        console.log('');
        console.log(chalk.cyan(`⚡ Builder Pro: http://localhost:${port}`));
        console.log(chalk.gray('📋 Viewer API: http://localhost:8080'));
        console.log('');
        console.log(chalk.yellow('🚀 New Features:'));
        console.log(chalk.gray('   • Visual node connections with SVG lines'));
        console.log(chalk.gray('   • Import/Export workflows as JSON'));
        console.log(chalk.gray('   • Push workflows to sim.ai'));
        console.log(chalk.gray('   • Enhanced node types (AI, HTTP, Logic)'));
        console.log(chalk.gray('   • Real-time execution log'));
        console.log('');
        console.log(chalk.yellow('💡 sim.ai Integration:'));
        console.log(chalk.gray('   • Click "Push to sim.ai" to deploy'));
        console.log(chalk.gray('   • Get API key from: https://sim.ai → Settings'));
        console.log('');
        console.log(chalk.gray('Press Ctrl+C to stop'));

        if (options.browser !== false) {
          // Open browser asynchronously without blocking
          import('open').then(openModule => {
            openModule.default(`http://localhost:${port}`).catch(err => {
              console.log(chalk.gray('\n💡 Open manually: http://localhost:' + port));
            });
          }).catch(err => {
            console.log(chalk.gray('\n💡 Open manually: http://localhost:' + port));
          });
        }
      });

      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n👋 Closing enhanced workflow builder...'));
        server.close();
        process.exit(0);
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to start enhanced workflow builder:'), error.message);
    }
  });

// Viewer command - start local live preview server with API
program
  .command('viewer')
  .description('Start live preview viewer for Spline scenes with API server')
  .option('-p, --port <port>', 'Server port', '8080')
  .option('--no-browser', 'Don\'t auto-open browser')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🎨 Starting Spline live preview viewer...'));

      const app = require('../viewer/api-server');
      const port = options.port;

      const server = app.listen(port, () => {
        console.log(chalk.green('✅ Viewer started successfully!'));
        console.log(chalk.cyan(`\n📡 Server running at: http://localhost:${port}`));
        console.log(chalk.cyan(`🔌 API available at: http://localhost:${port}/api`));
        console.log(chalk.gray('\nPress Ctrl+C to stop the server\n'));

        // Auto-open browser (unless disabled)
        if (options.browser !== false) {
          const { exec } = require('child_process');
          const platform = process.platform;
          const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
          exec(`${cmd} http://localhost:${port}`);
        }
      });

      // Handle server errors
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(chalk.red(`❌ Port ${port} is already in use`));
          console.log(chalk.yellow(`Try: spline-edit viewer --port ${parseInt(port) + 1}`));
        } else {
          console.error(chalk.red('❌ Server error:'), error.message);
        }
      });

    } catch (error) {
      console.error(chalk.red('❌ Failed to start viewer:'), error.message);
    }
  });

// Launch command - open Spline editor in browser
program
  .command('launch')
  .description('Launch Spline web editor in browser')
  .option('-p, --project <id>', 'Open specific project')
  .action(async (options) => {
    try {
      let url = 'https://app.spline.design';

      if (options.project) {
        url = `https://app.spline.design/file/${options.project}`;
        console.log(chalk.blue(`🚀 Launching Spline editor with project: ${options.project}`));
      } else {
        console.log(chalk.blue('🚀 Launching Spline editor...'));
      }

      const { exec } = require('child_process');
      const platform = process.platform;
      const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';

      exec(`${cmd} "${url}"`, (error) => {
        if (error) {
          console.log(chalk.red('❌ Failed to open browser'));
          console.log(chalk.yellow(`\nPlease open manually: ${url}`));
        } else {
          console.log(chalk.green('✅ Spline editor opened in browser!'));
          console.log(chalk.gray(`URL: ${url}`));
        }
      });
    } catch (error) {
      console.error(chalk.red('❌ Failed to launch editor:'), error.message);
    }
  });

// Inspect command - scene inspection tools (Blender MCP-inspired)
program
  .command('inspect <target>')
  .description('Inspect scene elements (objects|materials|cameras|hierarchy)')
  .option('-d, --details', 'Show detailed information')
  .option('-f, --format <format>', 'Output format (table|json)', 'table')
  .action(async (target, options) => {
    try {
      const status = await splineEditor.getStatus();

      if (!status.connected || !status.currentProject) {
        console.log(chalk.red('❌ No project is currently open'));
        console.log(chalk.yellow('Run: spline-edit open <project-id>'));
        return;
      }

      console.log(chalk.blue(`🔍 Inspecting ${target}...\n`));

      let data;
      switch(target.toLowerCase()) {
        case 'objects':
          data = await splineEditor.inspectObjects(options.details);
          break;
        case 'materials':
          data = await splineEditor.inspectMaterials();
          break;
        case 'cameras':
          data = await splineEditor.inspectCameras();
          break;
        case 'hierarchy':
          data = await splineEditor.inspectHierarchy();
          break;
        default:
          console.log(chalk.red(`❌ Unknown target: ${target}`));
          console.log(chalk.yellow('Available: objects, materials, cameras, hierarchy'));
          return;
      }

      if (options.format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        displayInspectionData(target, data);
      }
    } catch (error) {
      console.error(chalk.red('❌ Inspection failed:'), error.message);
    }
  });

// Batch command - batch operations (Blender MCP-inspired)
program
  .command('batch')
  .description('Perform batch operations on multiple objects')
  .option('-o, --objects <objects>', 'Comma-separated object names')
  .option('-p, --property <property>', 'Property to modify')
  .option('-v, --value <value>', 'New value')
  .option('--clone <name>', 'Clone object N times')
  .option('--count <count>', 'Number of clones', '3')
  .option('--offset <offset>', 'Clone offset "x,y,z"', '10,0,0')
  .action(async (options) => {
    try {
      if (options.clone) {
        const [x, y, z] = options.offset.split(',').map(v => parseFloat(v.trim()));
        const result = await splineEditor.cloneObject(options.clone, parseInt(options.count), { x, y, z });

        if (result.success) {
          console.log(chalk.green(`✅ Created ${options.count} clones of ${options.clone}`));
        } else {
          console.log(chalk.red('❌ Cloning failed:'), result.error);
        }
      } else if (options.objects && options.property && options.value) {
        const objectNames = options.objects.split(',').map(s => s.trim());
        const result = await splineEditor.batchUpdate(objectNames, options.property, options.value);

        if (result.success) {
          console.log(chalk.green(`✅ Updated ${objectNames.length} objects`));
          objectNames.forEach(name => {
            console.log(chalk.gray(`  - ${name}: ${options.property} = ${options.value}`));
          });
        } else {
          console.log(chalk.red('❌ Batch update failed:'), result.error);
        }
      } else {
        console.log(chalk.yellow('Usage examples:'));
        console.log(chalk.gray('  spline-edit batch --objects "Cube1,Cube2" --property position --value "0,10,0"'));
        console.log(chalk.gray('  spline-edit batch --clone Cube --count 5 --offset "10,0,0"'));
      }
    } catch (error) {
      console.error(chalk.red('❌ Batch operation failed:'), error.message);
    }
  });

// Screenshot command - export scene as image (Blender MCP-inspired)
program
  .command('screenshot')
  .description('Capture screenshot of current scene')
  .option('-o, --output <path>', 'Output file path', 'screenshot.png')
  .option('-w, --width <width>', 'Image width', '1920')
  .option('-h, --height <height>', 'Image height', '1080')
  .option('-q, --quality <quality>', 'Quality (low|medium|high)', 'high')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📸 Capturing screenshot...'));

      const result = await splineEditor.captureScreenshot({
        outputPath: options.output,
        width: parseInt(options.width),
        height: parseInt(options.height),
        quality: options.quality
      });

      if (result.success) {
        console.log(chalk.green('✅ Screenshot saved!'));
        console.log(`File: ${chalk.cyan(result.outputPath)}`);
        console.log(`Size: ${chalk.yellow(options.width)}x${chalk.yellow(options.height)}`);
      } else {
        console.log(chalk.red('❌ Screenshot failed:'), result.error);
      }
    } catch (error) {
      console.error(chalk.red('❌ Screenshot failed:'), error.message);
    }
  });

// Exec command - execute JavaScript code (Blender MCP-inspired)
program
  .command('exec [code]')
  .description('Execute JavaScript code in viewer context')
  .option('-f, --file <path>', 'Execute code from file')
  .action(async (code, options) => {
    try {
      let codeToExecute = code;

      if (options.file) {
        const fs = require('fs');
        codeToExecute = fs.readFileSync(options.file, 'utf-8');
        console.log(chalk.blue(`📜 Executing code from: ${options.file}`));
      } else if (code) {
        console.log(chalk.blue('⚡ Executing code...'));
      } else {
        console.log(chalk.yellow('Usage:'));
        console.log(chalk.gray('  spline-edit exec "cube.position.y += 10"'));
        console.log(chalk.gray('  spline-edit exec --file scripts/animate.js'));
        return;
      }

      const result = await splineEditor.executeCode(codeToExecute);

      if (result.success) {
        console.log(chalk.green('✅ Code executed successfully'));
        if (result.output) {
          console.log(chalk.gray('\nOutput:'));
          console.log(result.output);
        }
      } else {
        console.log(chalk.red('❌ Execution failed:'), result.error);
      }
    } catch (error) {
      console.error(chalk.red('❌ Execution failed:'), error.message);
    }
  });

// Helper function to display inspection data
function displayInspectionData(target, data) {
  switch(target) {
    case 'objects':
      console.log(chalk.bold('Objects in Scene:'));
      console.log(chalk.gray('─'.repeat(60)));
      data.forEach((obj, index) => {
        console.log(`${index + 1}. ${chalk.cyan(obj.name)} (${chalk.yellow(obj.type)})`);
        if (obj.position) console.log(`   Position: ${chalk.gray(JSON.stringify(obj.position))}`);
        if (obj.visible !== undefined) console.log(`   Visible: ${chalk.gray(obj.visible)}`);
        console.log('');
      });
      break;

    case 'materials':
      console.log(chalk.bold('Materials:'));
      console.log(chalk.gray('─'.repeat(60)));
      data.forEach((mat, index) => {
        console.log(`${index + 1}. ${chalk.cyan(mat.name)}`);
        if (mat.color) console.log(`   Color: ${chalk.gray(mat.color)}`);
        if (mat.metalness) console.log(`   Metalness: ${chalk.gray(mat.metalness)}`);
        console.log('');
      });
      break;

    case 'cameras':
      console.log(chalk.bold('Cameras:'));
      console.log(chalk.gray('─'.repeat(60)));
      data.forEach((cam, index) => {
        console.log(`${index + 1}. ${chalk.cyan(cam.name)}`);
        console.log(`   Position: ${chalk.gray(JSON.stringify(cam.position))}`);
        console.log(`   FOV: ${chalk.gray(cam.fov)}`);
        console.log('');
      });
      break;

    case 'hierarchy':
      console.log(chalk.bold('Scene Hierarchy:'));
      console.log(chalk.gray('─'.repeat(60)));
      printHierarchy(data, 0);
      break;
  }
}

function printHierarchy(nodes, level) {
  nodes.forEach(node => {
    const indent = '  '.repeat(level);
    console.log(`${indent}${chalk.cyan(node.name)} (${chalk.yellow(node.type)})`);
    if (node.children && node.children.length > 0) {
      printHierarchy(node.children, level + 1);
    }
  });
}

// Fetch command - automated Spline browser interaction
program
  .command('fetch')
  .description('Fetch scenes from Spline via automated browser')
  .option('-l, --list', 'List all your Spline projects')
  .option('-o, --open <project-id>', 'Open project in browser')
  .option('-d, --download <scene-url>', 'Download .splinecode file')
  .option('--load', 'Auto-load downloaded scene into viewer')
  .option('-p, --port <port>', 'Viewer port for auto-load', '8080')
  .option('--headless', 'Run browser in headless mode', true)
  .option('--visible', 'Show browser window')
  .option('-s, --screenshot <path>', 'Take screenshot of current page')
  .action(async (options) => {
    try {
      const fetcher = new SplineFetcher();

      // Launch browser
      const headless = options.visible ? false : options.headless;
      await fetcher.launch(headless);

      // Login to Spline
      const email = process.env.SPLINE_EMAIL;
      const password = process.env.SPLINE_PASSWORD;

      if (!email || !password) {
        console.log(chalk.red('❌ Missing credentials'));
        console.log(chalk.yellow('Set SPLINE_EMAIL and SPLINE_PASSWORD in .env file'));
        await fetcher.close();
        return;
      }

      const loginResult = await fetcher.loginToSpline(email, password);

      if (!loginResult.success) {
        console.log(chalk.red('❌ Login failed:'), loginResult.error);
        await fetcher.close();
        return;
      }

      // List projects
      if (options.list) {
        const result = await fetcher.fetchProjects();

        if (result.success) {
          console.log(chalk.green(`\n✅ Your Spline Projects (${result.projects.length}):`));
          console.log(chalk.gray('─'.repeat(60)));

          result.projects.forEach((project, index) => {
            console.log(`${index + 1}. ${chalk.cyan(project.name)}`);
            console.log(`   ID: ${chalk.gray(project.id)}`);
            console.log(`   URL: ${chalk.blue(project.url)}\n`);
          });

          await fetcher.close();
        } else {
          console.log(chalk.red('❌ Failed to fetch projects:'), result.error);
          await fetcher.close();
        }
        return;
      }

      // Open project in browser
      if (options.open) {
        let result;

        // If --open has a value, treat it as project name or ID
        if (typeof options.open === 'string') {
          // Check if it looks like a project ID (contains dashes or is alphanumeric)
          if (options.open.includes('-') || /^[a-zA-Z0-9]+$/.test(options.open)) {
            // Probably an ID
            result = await fetcher.openProjectInBrowser(options.open);
          } else {
            // Probably a name
            result = await fetcher.openProjectByName(options.open);
          }
        } else {
          // Just --open with no value, open account home
          result = await fetcher.openProjectInBrowser();
        }

        if (result.success) {
          console.log(chalk.green('✅ Browser opened successfully!'));
          console.log(chalk.cyan(`URL: ${result.url}`));

          if (!options.open || options.open === true) {
            console.log(chalk.yellow('\n💡 Now you can:'));
            console.log(chalk.gray('   • Browse your projects'));
            console.log(chalk.gray('   • Click any project to open it'));
            console.log(chalk.gray('   • Or tell CLI: "open <project-name>"'));
          } else {
            console.log(chalk.yellow('\n💡 Export your scene:'));
            console.log(chalk.gray('   1. Click Export → Code Export'));
            console.log(chalk.gray('   2. Copy the .splinecode URL'));
            console.log(chalk.gray('   3. Use: spline-edit fetch --download <URL>'));
          }

          console.log(chalk.blue('\n🌐 Browser will stay open for you to work...'));
          console.log(chalk.gray('Press Ctrl+C when done\n'));

          // Keep browser alive
          await fetcher.keepAlive();
        } else {
          console.log(chalk.red('❌ Failed to open:'), result.error);
          await fetcher.close();
        }
        return;
      }

      // Download scene
      if (options.download) {
        const sceneUrl = options.download;
        const filename = path.basename(sceneUrl);
        const outputPath = path.join(process.cwd(), 'scenes', filename);

        const result = await fetcher.downloadScene(sceneUrl, outputPath);

        if (result.success) {
          console.log(chalk.green('✅ Scene downloaded successfully!'));
          console.log(chalk.cyan(`File: ${result.outputPath}`));

          // Auto-load into viewer if --load flag is set
          if (options.load) {
            console.log(chalk.blue('\n📥 Loading scene into viewer...'));

            try {
              const axios = require('axios');
              const apiUrl = `http://localhost:${options.port}`;

              // Check if viewer is running
              await axios.get(`${apiUrl}/api/health`);

              // Load the scene
              const loadResponse = await axios.post(`${apiUrl}/api/load`, {
                url: sceneUrl
              });

              if (loadResponse.data.success) {
                console.log(chalk.green('✅ Scene loaded into viewer!'));
                console.log(chalk.cyan(`🌐 View at: http://localhost:${options.port}`));
              }
            } catch (error) {
              console.log(chalk.yellow('⚠️  Could not auto-load into viewer'));
              console.log(chalk.gray(`    Make sure viewer is running: spline-edit viewer`));
              console.log(chalk.gray(`    Then manually load: spline-edit load ${sceneUrl}`));
            }
          }
        } else {
          console.log(chalk.red('❌ Download failed:'), result.error);
        }

        await fetcher.close();
        return;
      }

      // Screenshot
      if (options.screenshot) {
        const result = await fetcher.takeScreenshot(options.screenshot);

        if (result.success) {
          console.log(chalk.green('✅ Screenshot captured!'));
        } else {
          console.log(chalk.red('❌ Screenshot failed:'), result.error);
        }

        await fetcher.close();
        return;
      }

      // Default: show help
      console.log(chalk.yellow('Usage examples:'));
      console.log(chalk.gray('  spline-edit fetch --list                             # List all projects'));
      console.log(chalk.gray('  spline-edit fetch --open <project-id>                # Open project in browser'));
      console.log(chalk.gray('  spline-edit fetch --download <url>                   # Download .splinecode file'));
      console.log(chalk.gray('  spline-edit fetch --download <url> --load            # Download and auto-load into viewer'));
      console.log(chalk.gray('  spline-edit fetch --visible --list                   # Show browser window'));

      await fetcher.close();

    } catch (error) {
      console.error(chalk.red('❌ Fetch failed:'), error.message);
    }
  });

// AI Edit command - Fully automated with AI agent
program
  .command('ai-edit [project]')
  .description('🤖 AI-powered: Automatically fetch and load scene (no manual steps!)')
  .option('-p, --port <port>', 'Viewer port', '8080')
  .option('--visible', 'Show browser window')
  .action(async (projectNameOrId, options) => {
    try {
      const axios = require('axios');
      const apiUrl = `http://localhost:${options.port}`;

      // Check OPENAI_API_KEY
      if (!process.env.OPENAI_API_KEY) {
        console.log(chalk.red('❌ Missing OPENAI_API_KEY'));
        console.log(chalk.yellow('Add OPENAI_API_KEY to your .env file'));
        console.log(chalk.gray('Get your API key from: https://platform.openai.com/api-keys'));
        return;
      }

      // Check if viewer is running
      console.log(chalk.blue('🔍 Checking viewer status...'));
      try {
        await axios.get(`${apiUrl}/api/health`);
        console.log(chalk.green('✅ Viewer is running'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Viewer is not running'));
        console.log(chalk.cyan('💡 Start it with: spline-edit viewer'));
        return;
      }

      // Initialize fetcher with AI
      const fetcher = new SplineFetcher();
      const headless = options.visible ? false : true;

      console.log(chalk.cyan('🤖 Launching browser with AI agent...'));
      await fetcher.launch(headless, true);  // useAI=true

      // Login
      const email = process.env.SPLINE_EMAIL;

      if (!email) {
        console.log(chalk.red('❌ Missing SPLINE_EMAIL'));
        console.log(chalk.yellow('Set SPLINE_EMAIL in .env file'));
        await fetcher.close();
        return;
      }

      console.log(chalk.blue('🔐 Logging into Spline account...'));
      const loginResult = await fetcher.loginToSpline(email);

      if (!loginResult.success) {
        console.log(chalk.red('❌ Login failed:'), loginResult.error);
        await fetcher.close();
        return;
      }

      // Fetch projects
      console.log(chalk.blue('📋 Fetching your projects...'));
      const projectsResult = await fetcher.fetchProjects();

      if (!projectsResult.success) {
        console.log(chalk.red('❌ Failed to fetch projects:'), projectsResult.error);
        await fetcher.close();
        return;
      }

      const projects = projectsResult.projects;

      if (projects.length === 0) {
        console.log(chalk.yellow('No projects found in your account'));
        await fetcher.close();
        return;
      }

      // Select project
      let selectedProject = null;

      if (projectNameOrId) {
        selectedProject = projects.find(p =>
          p.name.toLowerCase().includes(projectNameOrId.toLowerCase()) ||
          p.id === projectNameOrId
        );

        if (!selectedProject) {
          console.log(chalk.red(`❌ Project "${projectNameOrId}" not found`));
          await fetcher.close();
          return;
        }
      } else {
        console.log(chalk.green(`\n✅ Found ${projects.length} projects:\n`));
        projects.forEach((project, index) => {
          console.log(`${chalk.cyan((index + 1).toString())}. ${project.name}`);
          console.log(`   ${chalk.gray(project.id)}\n`);
        });

        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'projectIndex',
            message: 'Select a project to edit:',
            choices: projects.map((p, i) => ({
              name: `${i + 1}. ${p.name}`,
              value: i
            }))
          }
        ]);

        selectedProject = projects[answer.projectIndex];
      }

      console.log(chalk.blue(`📂 Opening project: ${chalk.cyan(selectedProject.name)}`));

      // Open project
      const openResult = await fetcher.openProjectInBrowser(selectedProject.id);

      if (!openResult.success) {
        console.log(chalk.red('❌ Failed to open project:'), openResult.error);
        await fetcher.close();
        return;
      }

      // AI automatically extracts export URL!
      console.log(chalk.cyan('\n🤖 AI Agent: Navigating Spline UI to get export URL...'));
      console.log(chalk.gray('   The AI will find the export menu and extract the URL automatically'));
      console.log('');

      const exportResult = await fetcher.aiGetExportUrl();

      if (!exportResult.success) {
        console.log(chalk.red('❌ AI failed to extract export URL:'), exportResult.error);
        console.log(chalk.yellow('💡 Fallback: Use the regular "edit" command instead'));
        await fetcher.close();
        return;
      }

      const exportUrl = exportResult.url;
      console.log(chalk.green(`✅ AI extracted export URL: ${exportUrl}`));

      // Load into viewer
      console.log(chalk.blue('\n📥 Loading scene into viewer...'));
      const loadResponse = await axios.post(`${apiUrl}/api/load`, {
        url: exportUrl
      });

      if (loadResponse.data.success) {
        console.log(chalk.green('✅ Scene loaded successfully!'));
        console.log(chalk.cyan(`🌐 View at: http://localhost:${options.port}`));
        console.log(chalk.yellow('\n💡 Now you can use CLI commands:'));
        console.log(chalk.gray('   spline-edit set Cube position "100,200,50"'));
        console.log(chalk.gray('   spline-edit var set score 100'));
        console.log(chalk.gray('   spline-edit preset save my-state'));
      }

      await fetcher.close();

    } catch (error) {
      console.error(chalk.red('❌ AI edit command failed:'), error.message);
    }
  });

// Edit command - Integrated fetch + load workflow (manual export URL)
program
  .command('edit [project]')
  .description('Fetch a scene from your Spline account and load it into the viewer (manual)')
  .option('-p, --port <port>', 'Viewer port', '8080')
  .option('--visible', 'Show browser window during fetch')
  .action(async (projectNameOrId, options) => {
    try {
      const axios = require('axios');
      const apiUrl = `http://localhost:${options.port}`;

      // Check if viewer is running
      console.log(chalk.blue('🔍 Checking viewer status...'));
      try {
        await axios.get(`${apiUrl}/api/health`);
        console.log(chalk.green('✅ Viewer is running'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  Viewer is not running'));
        console.log(chalk.cyan('💡 Start it with: spline-edit viewer'));
        return;
      }

      // Initialize fetcher
      const fetcher = new SplineFetcher();
      const headless = options.visible ? false : true;

      await fetcher.launch(headless);

      // Login
      const email = process.env.SPLINE_EMAIL;
      const password = process.env.SPLINE_PASSWORD;

      if (!email || !password) {
        console.log(chalk.red('❌ Missing credentials'));
        console.log(chalk.yellow('Set SPLINE_EMAIL and SPLINE_PASSWORD in .env file'));
        await fetcher.close();
        return;
      }

      console.log(chalk.blue('🔐 Logging into Spline account...'));
      const loginResult = await fetcher.loginToSpline(email, password);

      if (!loginResult.success) {
        console.log(chalk.red('❌ Login failed:'), loginResult.error);
        await fetcher.close();
        return;
      }

      // Fetch projects
      console.log(chalk.blue('📋 Fetching your projects...'));
      const projectsResult = await fetcher.fetchProjects();

      if (!projectsResult.success) {
        console.log(chalk.red('❌ Failed to fetch projects:'), projectsResult.error);
        await fetcher.close();
        return;
      }

      const projects = projectsResult.projects;

      if (projects.length === 0) {
        console.log(chalk.yellow('No projects found in your account'));
        await fetcher.close();
        return;
      }

      // Select project
      let selectedProject = null;

      if (projectNameOrId) {
        // Find by name or ID
        selectedProject = projects.find(p =>
          p.name.toLowerCase().includes(projectNameOrId.toLowerCase()) ||
          p.id === projectNameOrId
        );

        if (!selectedProject) {
          console.log(chalk.red(`❌ Project "${projectNameOrId}" not found`));
          await fetcher.close();
          return;
        }
      } else {
        // Interactive selection
        console.log(chalk.green(`\n✅ Found ${projects.length} projects:\n`));
        projects.forEach((project, index) => {
          console.log(`${chalk.cyan((index + 1).toString())}. ${project.name}`);
          console.log(`   ${chalk.gray(project.id)}\n`);
        });

        const answer = await inquirer.prompt([
          {
            type: 'list',
            name: 'projectIndex',
            message: 'Select a project to edit:',
            choices: projects.map((p, i) => ({
              name: `${i + 1}. ${p.name}`,
              value: i
            }))
          }
        ]);

        selectedProject = projects[answer.projectIndex];
      }

      console.log(chalk.blue(`📂 Opening project: ${chalk.cyan(selectedProject.name)}`));

      // Open project in browser to get export URL
      const openResult = await fetcher.openProjectInBrowser(selectedProject.id);

      if (!openResult.success) {
        console.log(chalk.red('❌ Failed to open project:'), openResult.error);
        await fetcher.close();
        return;
      }

      console.log(chalk.yellow('\n🔗 To load this scene into the viewer:'));
      console.log(chalk.gray('   1. In the Spline editor, click: File → Export → Code Export'));
      console.log(chalk.gray('   2. Click "Copy URL" to get the .splinecode URL'));
      console.log(chalk.gray('   3. Paste it below (or press Ctrl+C to cancel)\n'));

      // Prompt for export URL
      const urlAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'exportUrl',
          message: 'Paste the .splinecode URL:',
          validate: (input) => {
            if (!input) return 'URL is required';
            if (!input.includes('.splinecode')) return 'Must be a .splinecode URL';
            return true;
          }
        }
      ]);

      // Load into viewer
      console.log(chalk.blue('📥 Loading scene into viewer...'));
      const loadResponse = await axios.post(`${apiUrl}/api/load`, {
        url: urlAnswer.exportUrl
      });

      if (loadResponse.data.success) {
        console.log(chalk.green('✅ Scene loaded successfully!'));
        console.log(chalk.cyan(`🌐 View at: http://localhost:${options.port}`));
        console.log(chalk.yellow('\n💡 Now you can use CLI commands:'));
        console.log(chalk.gray('   spline-edit set Cube position "100,200,50"'));
        console.log(chalk.gray('   spline-edit var set score 100'));
        console.log(chalk.gray('   spline-edit preset save my-state'));
      }

      await fetcher.close();

    } catch (error) {
      console.error(chalk.red('❌ Edit command failed:'), error.message);
    }
  });

// Status command
program
  .command('status')
  .description('Show current connection and project status')
  .action(async () => {
    try {
      const status = await splineEditor.getStatus();
      
      console.log(chalk.bold('\n🔍 Spline CLI Status:'));
      console.log(chalk.gray('─'.repeat(30)));
      
      console.log(`Connection: ${status.connected ? chalk.green('Connected') : chalk.red('Disconnected')}`);
      
      if (status.connected) {
        console.log(`User: ${chalk.cyan(status.user.name)}`);
        console.log(`Email: ${chalk.gray(status.user.email)}`);
      }
      
      if (status.currentProject) {
        console.log(`\nCurrent Project: ${chalk.cyan(status.currentProject.name)}`);
        console.log(`Project ID: ${chalk.gray(status.currentProject.id)}`);
        console.log(`Objects: ${chalk.yellow(status.currentProject.objectCount)}`);
      } else {
        console.log(`\nCurrent Project: ${chalk.gray('None')}`);
      }
      
      console.log('');
    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'), error.message);
    }
  });

// ============================================================================
// PHASE 1: RUNTIME COMMANDS (Real Spline API via Viewer)
// ============================================================================

// Load command - load a .splinecode URL into viewer
program
  .command('load <url>')
  .description('Load a Spline scene into the viewer')
  .option('-p, --port <port>', 'Viewer port', '8080')
  .action(async (url, options) => {
    try {
      const axios = require('axios');
      const apiUrl = `http://localhost:${options.port}/api/load`;

      console.log(chalk.blue(`📥 Loading scene: ${url}`));

      const response = await axios.post(apiUrl, { url });

      if (response.data.success) {
        console.log(chalk.green('✅ Scene loaded successfully!'));
        console.log(chalk.cyan(`URL: ${response.data.url}`));
        console.log(chalk.gray('\n💡 Tip: Open http://localhost:' + options.port + ' to see it'));
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.red('❌ Viewer not running'));
        console.log(chalk.yellow('Start it with: spline-edit viewer'));
      } else {
        console.error(chalk.red('❌ Failed to load scene:'), error.message);
      }
    }
  });

// Get command - get object property
program
  .command('get <object> <property>')
  .description('Get an object property value')
  .option('-p, --port <port>', 'Viewer port', '8080')
  .action(async (object, property, options) => {
    try {
      const axios = require('axios');
      const apiUrl = `http://localhost:${options.port}/api/get`;

      console.log(chalk.blue(`🔍 Getting ${object}.${property}...`));

      const response = await axios.post(apiUrl, { object, property });

      if (response.data.success) {
        console.log(chalk.green('✅ Command queued'));
        console.log(chalk.gray('Note: Check viewer for actual value'));
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.red('❌ Viewer not running'));
        console.log(chalk.yellow('Start it with: spline-edit viewer'));
      } else if (error.response) {
        console.error(chalk.red('❌ Error:'), error.response.data.error);
      } else {
        console.error(chalk.red('❌ Failed:'), error.message);
      }
    }
  });

// Set command - set object property
program
  .command('set <object> <property> <value>')
  .description('Set an object property value')
  .option('-p, --port <port>', 'Viewer port', '8080')
  .action(async (object, property, value, options) => {
    try {
      const axios = require('axios');
      const apiUrl = `http://localhost:${options.port}/api/set`;

      console.log(chalk.blue(`✏️  Setting ${object}.${property} = ${value}...`));

      const response = await axios.post(apiUrl, { object, property, value });

      if (response.data.success) {
        console.log(chalk.green('✅ Property updated!'));
        console.log(chalk.cyan(`${object}.${property} = ${value}`));
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.red('❌ Viewer not running'));
        console.log(chalk.yellow('Start it with: spline-edit viewer'));
      } else if (error.response) {
        console.error(chalk.red('❌ Error:'), error.response.data.error);
      } else {
        console.error(chalk.red('❌ Failed:'), error.message);
      }
    }
  });

// Var command - get/set variables
program
  .command('var <action> <name> [value]')
  .description('Get or set Spline variables (actions: get, set)')
  .option('-p, --port <port>', 'Viewer port', '8080')
  .action(async (action, name, value, options) => {
    try {
      const axios = require('axios');

      if (action === 'get') {
        const apiUrl = `http://localhost:${options.port}/api/var/get`;
        console.log(chalk.blue(`🔍 Getting variable: ${name}...`));

        const response = await axios.post(apiUrl, { name });

        if (response.data.success) {
          console.log(chalk.green('✅ Command queued'));
          console.log(chalk.gray('Note: Check viewer for actual value'));
        }
      } else if (action === 'set') {
        if (value === undefined) {
          console.log(chalk.red('❌ Value required for set action'));
          return;
        }

        const apiUrl = `http://localhost:${options.port}/api/var/set`;
        console.log(chalk.blue(`✏️  Setting variable: ${name} = ${value}...`));

        const response = await axios.post(apiUrl, { name, value });

        if (response.data.success) {
          console.log(chalk.green('✅ Variable updated!'));
          console.log(chalk.cyan(`${name} = ${value}`));
        }
      } else {
        console.log(chalk.red(`❌ Unknown action: ${action}`));
        console.log(chalk.gray('Use: get or set'));
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.red('❌ Viewer not running'));
        console.log(chalk.yellow('Start it with: spline-edit viewer'));
      } else if (error.response) {
        console.error(chalk.red('❌ Error:'), error.response.data.error);
      } else {
        console.error(chalk.red('❌ Failed:'), error.message);
      }
    }
  });

// Preset command - save/load/list presets
program
  .command('preset <action> [name]')
  .description('Manage presets (actions: save, load, list)')
  .option('-p, --port <port>', 'Viewer port', '8080')
  .option('-o, --objects <objects>', 'Objects to include (comma-separated)')
  .action(async (action, name, options) => {
    try {
      const axios = require('axios');

      if (action === 'save') {
        if (!name) {
          console.log(chalk.red('❌ Preset name required'));
          return;
        }

        const apiUrl = `http://localhost:${options.port}/api/preset/save`;
        const objects = options.objects ? options.objects.split(',') : [];

        console.log(chalk.blue(`💾 Saving preset: ${name}...`));

        const response = await axios.post(apiUrl, { name, objects });

        if (response.data.success) {
          console.log(chalk.green('✅ Preset saved!'));
          console.log(chalk.cyan(`Name: ${name}`));
        }
      } else if (action === 'load') {
        if (!name) {
          console.log(chalk.red('❌ Preset name required'));
          return;
        }

        const apiUrl = `http://localhost:${options.port}/api/preset/load`;
        console.log(chalk.blue(`📂 Loading preset: ${name}...`));

        const response = await axios.post(apiUrl, { name });

        if (response.data.success) {
          console.log(chalk.green('✅ Preset loaded!'));
          console.log(chalk.cyan(`Name: ${name}`));
        }
      } else if (action === 'list') {
        const apiUrl = `http://localhost:${options.port}/api/preset/list`;
        console.log(chalk.blue('📋 Listing presets...'));

        const response = await axios.get(apiUrl);

        if (response.data.success) {
          console.log(chalk.green('✅ Command queued'));
          console.log(chalk.gray('Note: Check viewer for preset list'));
        }
      } else {
        console.log(chalk.red(`❌ Unknown action: ${action}`));
        console.log(chalk.gray('Use: save, load, or list'));
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.red('❌ Viewer not running'));
        console.log(chalk.yellow('Start it with: spline-edit viewer'));
      } else if (error.response) {
        console.error(chalk.red('❌ Error:'), error.response.data.error);
      } else {
        console.error(chalk.red('❌ Failed:'), error.message);
      }
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red('❌ Invalid command: %s'), program.args.join(' '));
  console.log(chalk.blue('See --help for available commands'));
  process.exitCode = 1;
});

// Parse command line arguments
program.parse();

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}