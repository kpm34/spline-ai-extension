// Simple CORS proxy for SIM.ai API
// This wraps the SIM.ai API calls and adds CORS headers

const SIMAI_API_BASE = 'http://localhost:3003/api/v1';

// Wrap fetch to add proper error handling and retries
async function corsProxyFetch(endpoint, options = {}) {
    const url = `${SIMAI_API_BASE}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors',
            credentials: 'omit',
            headers: {
                ...options.headers,
                'Accept': 'application/json',
            }
        });

        return response;
    } catch (error) {
        // If CORS fails, provide helpful error message
        if (error.message.includes('CORS') || error.message.includes('NetworkError')) {
            throw new Error('CORS_ERROR: SIM.ai server needs CORS configuration. See documentation for setup.');
        }
        throw error;
    }
}

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { corsProxyFetch };
}
