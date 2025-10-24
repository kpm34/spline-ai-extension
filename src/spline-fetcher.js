require('dotenv').config({ silent: true });
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { SplineAIAgent } = require('./spline-ai-agent');
const { EmailReader } = require('./email-reader');

class SplineFetcher {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isLoggedIn = false;
    this.cachePath = path.join(os.homedir(), '.spline-cli', 'scenes');
    this.aiAgent = null;
    this.emailReader = null;
  }

  async launch(headless = true, useAI = false) {
    console.log('🚀 Launching browser...');
    this.browser = await puppeteer.launch({
      headless: headless ? 'new' : false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });

    // Initialize AI agent if requested
    if (useAI) {
      console.log('🤖 Initializing AI agent...');
      this.aiAgent = new SplineAIAgent(this.page);
      console.log('✅ AI agent ready');
    }
  }

  async loginToSpline(email, password, autoReadEmail = true) {
    if (!email) {
      throw new Error('Email required. Set SPLINE_EMAIL in .env');
    }

    try {
      console.log('🔐 Navigating to Spline login...');

      // Go to Spline app login page
      await this.page.goto('https://app.spline.design/signin', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      console.log('📝 Entering email...');

      // Wait for email input and type
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
      await this.page.type('input[type="email"], input[name="email"]', email);

      console.log('🔑 Submitting email...');

      // Click continue/submit button
      await this.page.click('button[type="submit"]');

      // Wait a moment for the page to process
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('');
      console.log('📧 Spline has sent a verification code to your email!');
      console.log('');

      // Check if we should auto-read email
      const hasGmailPassword = process.env.GMAIL_APP_PASSWORD;

      if (autoReadEmail && hasGmailPassword) {
        console.log('🤖 Automatically retrieving code from Gmail...');
        console.log('');

        try {
          // Initialize email reader
          this.emailReader = new EmailReader();

          // Get verification code from email
          const code = await this.emailReader.getSplineVerificationCode(60);

          console.log('');
          console.log(`🤖 Auto-entering code: ${code}`);

          // Find the verification code input field and enter the code
          await this.page.waitForSelector('input[type="text"], input[name="code"], input[placeholder*="code"]', { timeout: 5000 });
          await this.page.type('input[type="text"], input[name="code"], input[placeholder*="code"]', code);

          // Submit the code
          await this.page.click('button[type="submit"]');

          console.log('✅ Code entered automatically!');

          // Clean up email reader
          await this.emailReader.close();

        } catch (emailError) {
          console.log('⚠️  Could not auto-retrieve code:', emailError.message);
          console.log('💡 Falling back to manual entry...');
          console.log('');
          console.log('   → Check your email: ' + email);
          console.log('   → Enter the code in the browser window');
          console.log('');
        }
      } else {
        if (!hasGmailPassword) {
          console.log('💡 Tip: Add GMAIL_APP_PASSWORD to .env for automatic code entry!');
          console.log('');
        }
        console.log('   → Check your email: ' + email);
        console.log('   → Find the verification code');
        console.log('   → Enter it in the browser window');
        console.log('   → The CLI will automatically continue after you submit');
        console.log('');
      }

      console.log('⏳ Waiting for login to complete (up to 5 minutes)...');
      console.log('');

      // Wait up to 5 minutes for login to complete
      try {
        await this.page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 300000  // 5 minutes
        });
      } catch (navError) {
        // Check current URL even if navigation timeout
        console.log('⏰ Navigation timeout, checking current page...');
      }

      // Give it a moment to settle
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if we're logged in by looking for the home page
      const url = this.page.url();

      if (url.includes('app.spline.design') && !url.includes('signin')) {
        console.log('✅ Successfully logged in to Spline!');
        this.isLoggedIn = true;
        return { success: true };
      } else {
        console.log('⚠️  Still on login page. Current URL:', url);
        console.log('💡 Tip: Make sure you entered the verification code correctly');
        return { success: false, error: 'Login verification not completed' };
      }

    } catch (error) {
      console.error('❌ Login error:', error.message);
      return { success: false, error: error.message };
    } finally {
      // Clean up email reader if it exists
      if (this.emailReader) {
        await this.emailReader.close();
      }
    }
  }

  async fetchProjects() {
    if (!this.isLoggedIn) {
      throw new Error('Not logged in. Call loginToSpline() first.');
    }

    try {
      console.log('📋 Fetching your Spline projects...');

      // Navigate to home/projects page
      await this.page.goto('https://app.spline.design/home', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for projects to load
      await this.page.waitForSelector('[data-testid="project-card"], .project-card, article', {
        timeout: 10000
      });

      // Extract project data
      const projects = await this.page.evaluate(() => {
        const projectElements = document.querySelectorAll('[data-testid="project-card"], .project-card, article');
        const results = [];

        projectElements.forEach(el => {
          try {
            const nameEl = el.querySelector('h3, h2, .project-name, [class*="title"]');
            const linkEl = el.querySelector('a');

            if (nameEl && linkEl) {
              const name = nameEl.textContent.trim();
              const href = linkEl.getAttribute('href');

              // Extract project ID from URL
              let projectId = null;
              if (href) {
                const match = href.match(/\/file\/([a-zA-Z0-9_-]+)/);
                projectId = match ? match[1] : null;
              }

              if (projectId) {
                results.push({
                  name: name,
                  id: projectId,
                  url: `https://app.spline.design/file/${projectId}`
                });
              }
            }
          } catch (err) {
            // Skip this element
          }
        });

        return results;
      });

      console.log(`✅ Found ${projects.length} projects`);
      return { success: true, projects };

    } catch (error) {
      console.error('❌ Error fetching projects:', error.message);
      return { success: false, error: error.message };
    }
  }

  async fetchSceneUrl(projectId) {
    try {
      console.log(`🔍 Fetching scene URL for project: ${projectId}`);

      // Navigate to project
      await this.page.goto(`https://app.spline.design/file/${projectId}`, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for the editor to load
      await this.page.waitForTimeout(3000);

      // Try to extract the scene URL from network requests or page
      // This might require intercepting network requests or checking the page source

      // For now, construct the export URL (this is a common pattern)
      // Users typically need to export their scenes manually

      return {
        success: true,
        projectId: projectId,
        projectUrl: `https://app.spline.design/file/${projectId}`,
        message: 'Project loaded. To get .splinecode URL, use Export → Code Export in Spline editor.'
      };

    } catch (error) {
      console.error('❌ Error fetching scene URL:', error.message);
      return { success: false, error: error.message };
    }
  }

  async downloadScene(sceneUrl, outputPath) {
    try {
      console.log(`📥 Downloading scene from: ${sceneUrl}`);

      const response = await this.page.goto(sceneUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const buffer = await response.buffer();

      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, buffer);

      console.log(`✅ Scene downloaded to: ${outputPath}`);
      return { success: true, outputPath };

    } catch (error) {
      console.error('❌ Download error:', error.message);
      return { success: false, error: error.message };
    }
  }

  async openProjectInBrowser(projectId = null) {
    try {
      if (projectId) {
        console.log(`🌐 Opening project in browser: ${projectId}`);
        const url = `https://app.spline.design/file/${projectId}`;
        await this.page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        console.log('✅ Project opened in browser');
        console.log(`📍 URL: ${url}`);
      } else {
        console.log(`🌐 Opening your Spline account...`);
        // Just go to home page - user is already logged in
        await this.page.goto('https://app.spline.design/home', {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        console.log('✅ Spline account opened!');
        console.log(`📍 URL: https://app.spline.design/home`);
      }

      // Keep browser open for user interaction
      return { success: true, url: this.page.url() };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async openProjectByName(projectName) {
    try {
      console.log(`🔍 Searching for project: "${projectName}"`);

      // First, fetch all projects
      const result = await this.fetchProjects();
      if (!result.success) {
        return { success: false, error: 'Could not fetch projects' };
      }

      // Find project by name (case-insensitive)
      const project = result.projects.find(p =>
        p.name.toLowerCase().includes(projectName.toLowerCase())
      );

      if (!project) {
        console.log(`❌ Project not found: "${projectName}"`);
        console.log('\nAvailable projects:');
        result.projects.forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.name}`);
        });
        return { success: false, error: 'Project not found' };
      }

      console.log(`✅ Found: ${project.name} (${project.id})`);

      // Open the project
      return await this.openProjectInBrowser(project.id);

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async takeScreenshot(outputPath) {
    try {
      await fs.ensureDir(path.dirname(outputPath));
      await this.page.screenshot({ path: outputPath, fullPage: false });
      console.log(`📸 Screenshot saved to: ${outputPath}`);
      return { success: true, outputPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * AI-powered: Automatically extract export URL from current Spline project
   */
  async aiGetExportUrl() {
    if (!this.aiAgent) {
      throw new Error('AI agent not initialized. Call launch() with useAI=true');
    }

    console.log('🤖 AI Agent: Navigating to export menu and extracting URL...');
    const result = await this.aiAgent.getExportUrl();

    if (result.success && result.result) {
      return { success: true, url: result.result };
    }

    return { success: false, error: 'AI agent could not extract export URL' };
  }

  /**
   * AI-powered: Automatically list all projects from Spline home
   */
  async aiExtractProjectList() {
    if (!this.aiAgent) {
      throw new Error('AI agent not initialized. Call launch() with useAI=true');
    }

    console.log('🤖 AI Agent: Extracting project list...');
    const result = await this.aiAgent.extractProjectList();

    if (result.success && result.result) {
      return { success: true, projects: result.result };
    }

    return { success: false, error: 'AI agent could not extract projects' };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  async keepAlive() {
    console.log('🌐 Browser will stay open. Press Ctrl+C to close.');

    // Keep the process alive
    return new Promise(() => {
      // This promise never resolves, keeping the browser open
    });
  }
}

module.exports = { SplineFetcher };
