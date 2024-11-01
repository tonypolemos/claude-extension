const https = require('https');

module.exports = async (req, res) => {
  // Manejar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error('CLAUDE_API_KEY not configured');
    }

    const requestBody = {
      model: req.body.model || "claude-3-opus-20240229",
      max_tokens: req.body.max_tokens || 1024,
      temperature: req.body.temperature || 0.7,
      messages: req.body.messages,
      system: req.body.system
    };

    console.log('Sending request to Claude:', JSON.stringify(requestBody));

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    };

    return new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        
        proxyRes.on('data', (chunk) => {
          data += chunk;
        });
        
        proxyRes.on('end', () => {
          try {
            console.log('Raw response from Claude:', data);
            const responseData = JSON.parse(data);
            res.status(proxyRes.statusCode).json(responseData);
            resolve();
          } catch (error) {
            console.error('Error parsing response:', error);
            res.status(500).json({ error: 'Error parsing response from Claude', details: error.message });
            resolve();
          }
        });
      });

      proxyReq.on('error', (error) => {
        console.error('Request error:', error);
        res.status(500).json({ error: 'Error connecting to Claude API', details: error.message });
        resolve();
      });

      proxyReq.write(JSON.stringify(requestBody));
      proxyReq.end();
    });
  } catch (error) {
    console.error('General error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
