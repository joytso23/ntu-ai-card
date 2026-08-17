export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;

  // 1. 檢查 API Key 是否存在
  if (!apiKey) {
    return res.status(500).json({ 
      error: "KEY_MISSING", 
      message: "GEMINI_API_KEY is missing in Vercel Environment Variables." 
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { data, targetLang } = body || {};

    const promptText = `Translate all text values in this JSON to ${targetLang === 'en' ? 'English' : 'Traditional Chinese'}. Keep JSON structure and keys intact. Return ONLY raw JSON:\n${JSON.stringify(data)}`;

    // 2. 發送 API 請求
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const resData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: "GEMINI_API_ERROR", 
        details: resData.error || resData 
      });
    }

    const rawText = resData.candidates[0].content.parts[0].text;
    return res.status(200).json({ translated: JSON.parse(rawText) });

  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: err.message });
  }
}
