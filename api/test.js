export default async function handler(req, res) {
  try {
    // Test if we can reach the VPS at all
    const response = await fetch('http://187.77.212.77:18789/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer cLVJRZ4dM4QEOQxZbBqc94jWevmBEtoI'
      },
      body: JSON.stringify({
        model: 'openclaw',
        messages: [{ role: 'user', content: 'test' }],
        stream: false
      })
    });

    const text = await response.text();
    
    return res.status(200).json({ 
      success: true, 
      status: response.status,
      body: text.substring(0, 200)
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      cause: error.cause?.message
    });
  }
}
