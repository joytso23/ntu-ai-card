export default async function handler(req, res) {
  // 設定 CORS 標頭，允許前端呼叫
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ 找不到 GEMINI_API_KEY 環境變數");
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in environment variables." });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { data, targetLang } = body || {};

    if (!data) {
      return res.status(400).json({ error: "No data provided" });
    }

    const promptText = `Translate all text values in the following JSON object to ${targetLang === 'en' ? 'English' : 'Traditional Chinese'}. 
Keep array lengths and key names EXACTLY the same. 
Do NOT alter key names. 
Return ONLY the raw JSON object without any Markdown formatting or backticks.

JSON:
${JSON.stringify(data)}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const resData = await response.json();

    if (!response.ok) {
      console.error("Gemini API 回傳錯誤:", resData);
      return res.status(500).json({ error: resData.error?.message || "Gemini API Error" });
    }

    const rawText = resData.candidates[0].content.parts[0].text;
    const translatedObj = JSON.parse(rawText);

    return res.status(200).json({ translated: translatedObj });

  } catch (err) {
    console.error("Translate Handler Error:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
