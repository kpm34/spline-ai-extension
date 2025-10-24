require('dotenv').config({ silent: true });
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

/**
 * EmailReader - Automatically reads verification codes from email
 * Supports Gmail via IMAP
 */
class EmailReader {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to Gmail via IMAP
   */
  async connect() {
    const config = {
      imap: {
        user: process.env.GMAIL_USER || process.env.SPLINE_EMAIL,
        password: process.env.GMAIL_APP_PASSWORD,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000
      }
    };

    if (!config.imap.user || !config.imap.password) {
      throw new Error('Gmail credentials missing. Set GMAIL_APP_PASSWORD in .env');
    }

    console.log('📧 Connecting to Gmail...');
    this.connection = await imaps.connect(config);
    console.log('✅ Connected to Gmail');
  }

  /**
   * Search for recent Spline verification emails
   */
  async getSplineVerificationCode(maxWaitSeconds = 60) {
    if (!this.connection) {
      await this.connect();
    }

    await this.connection.openBox('INBOX');

    const searchCriteria = [
      'UNSEEN',  // Unread emails
      ['FROM', 'spline'],
      ['SINCE', new Date(Date.now() - 5 * 60 * 1000)]  // Last 5 minutes
    ];

    const fetchOptions = {
      bodies: ['HEADER', 'TEXT', ''],
      markSeen: true
    };

    console.log('🔍 Searching for Spline verification email...');

    const startTime = Date.now();
    const pollInterval = 3000; // Check every 3 seconds

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      try {
        const messages = await this.connection.search(searchCriteria, fetchOptions);

        for (const message of messages) {
          const all = message.parts.find(part => part.which === '');
          const id = message.attributes.uid;
          const idHeader = `Msg #${id}`;

          if (all && all.body) {
            const mail = await simpleParser(all.body);

            // Check if it's from Spline
            const from = mail.from ? mail.from.text : '';
            if (from.toLowerCase().includes('spline') ||
                mail.subject?.toLowerCase().includes('spline') ||
                mail.subject?.toLowerCase().includes('verification')) {

              console.log('✅ Found Spline email!');

              // Extract verification code from email
              const code = this.extractVerificationCode(mail.text || mail.html);

              if (code) {
                console.log(`✅ Verification code found: ${code}`);
                return code;
              }
            }
          }
        }

        // Wait before next check
        console.log(`⏳ No code yet, checking again in ${pollInterval/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error('Search error:', error.message);
      }
    }

    throw new Error('Verification code not received within timeout');
  }

  /**
   * Extract verification code from email text
   */
  extractVerificationCode(text) {
    if (!text) return null;

    // Common patterns for verification codes
    const patterns = [
      /verification code is:?\s*([A-Z0-9]{6})/i,
      /code:?\s*([A-Z0-9]{6})/i,
      /([A-Z0-9]{6})\s*is your verification/i,
      /your code:?\s*([A-Z0-9]{6})/i,
      /\b([A-Z0-9]{6})\b/,  // Generic 6-character code
      /verification code:?\s*(\d{6})/i,  // 6 digits
      /code is:?\s*(\d{6})/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Close the connection
   */
  async close() {
    if (this.connection) {
      this.connection.end();
      console.log('📧 Gmail connection closed');
    }
  }
}

module.exports = { EmailReader };
