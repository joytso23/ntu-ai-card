// /api/translate-card.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { data, targetLang } = req.body;
  
  const prompt = `Translate the following user profile fields into standard, professional English. Keep all tone polite and natural. Return ONLY a valid JSON object matching the input key structure.
  
Input: ${JSON.stringify(data)}`;

  try {
    // 呼叫你的 AI 端點進行翻譯
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });
    
    const jsonRes = await response.json();
    const translatedObj = JSON.parse(jsonRes.candidates[0].content.parts[0].text);
    return res.status(200).json({ translated: translatedObj });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
