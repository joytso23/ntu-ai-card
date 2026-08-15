export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 從 Vercel 環境變數安全讀取 Key
  const apiKey = process.env.GEMINI_API_KEY; 
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  const { name, school, dept, title, exp, skills } = req.body;

  const prompt = `你是一位高階科技職涯顧問。請根據下方背景資料，為他/她撰寫一段高質感、具個人特色且自信專業的個人簡介（約 80-120 字）。

原則：
1. 嚴禁使用罐頭套話（如：「嗨！我是...」）。
2. 請結合其系所背景、經歷與技能特色。
3. 使用第一人稱「我」，語氣自信且具科技感。

【背景】
- 姓名：${name}
- 學校/系所：${school} ${dept}
- 身份/職務：${title}
- 重要經歷：${exp}
- 專業技能：${skills}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return res.status(200).json({ text: resultText });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate bio' });
  }
}
