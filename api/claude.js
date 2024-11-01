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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    console.log('Received request body:', req.body); // Para debugging

    const claudeRequest = {
      model: req.body.model,
      messages: req.body.messages
    };

    console.log('Sending to Claude:', claudeRequest); // Para debugging

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    };

    const claudeResponse = await new Promise((resolve, reject) => {
      const proxyReq = https.request(options, (proxyRes) => {
        let data = '';
        
        proxyRes.on('data', (chunk) => {
          data += chunk;
        });
        
        proxyRes.on('end', () => {
          console.log('Raw Claude response:', data); // Para debugging
          resolve({ statusCode: proxyRes.statusCode, data });
        });
      });

      proxyReq.on('error', (error) => {
        console.error('Claude API error:', error);
        reject(error);
      });

      proxyReq.write(JSON.stringify(claudeRequest));
      proxyReq.end();
    });

    console.log('Claude response status:', claudeResponse.statusCode); // Para debugging

    if (claudeResponse.statusCode !== 200) {
      return res.status(claudeResponse.statusCode).send(claudeResponse.data);
    }

    const parsedResponse = JSON.parse(claudeResponse.data);
    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
