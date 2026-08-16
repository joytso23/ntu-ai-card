export default async function handler(req, res) {
  // 1. 限制僅能使用 POST 方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. 從 Vercel 環境變數安全讀取 Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key not configured' });
  }

  const { name, school, dept, title, exp, skills } = req.body || {};

  // 3. 欄位長度防禦（防止過長 Token 攻擊與濫用）
  const combinedText = `${name || ''}${school || ''}${dept || ''}${title || ''}${exp || ''}${skills || ''}`;
  if (combinedText.length > 500) {
    return res.status(400).json({ error: '輸入內容過長，請精簡後再試。' });
  }

  // 4. 優化後的 Prompt：具備人性化人設推演與風格匹配
  const prompt = `你是一位敏銳的個人品牌與職涯資深顧問。請深入分析下方個人的學歷、經歷、社團與技能，解讀他/她的職涯人設與個人風格，並撰寫一段極具人性化、自然且具辨識度的個人簡介 (About Me)。

【背景資料】
- 姓名：${name || '未提供'}
- 學校/系所：${school || ''} ${dept || ''}
- 身份/職務：${title || '未提供'}
- 重要經歷/社團/實習：${exp || '未提供'}
- 專業技能：${skills || '未提供'}

【撰寫原則與風格要求】
1. 人性化洞察：不要只是列舉經歷！請根據他/她的「實習、工作、專案或社團經驗」去推演他/她的性格亮點（例如：做過創業者/社團幹部展現領導力與行動力；做過數據/量化展現邏輯與嚴謹；做過行銷/設計展現創意與敏銳度）。
2. 自然口語：嚴禁使用「嗨！我是...」、「這是我...」等機器人或範本開頭，也不要硬塞高大上的堆砌詞彙。語氣要像是在個人網站或 LinkedIn 上真實自然地自我介紹。
3. 第一人稱：全程使用第一人稱「我」，字數控制在 80 ~ 130 字之間。
4. 輸出格式：請直接輸出最終的簡介內文，不要包含任何開場白或額外解釋。`;

  try {
    // 使用目前穩定的 gemini-1.5-flash 模型 API 端點
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error Response:', data);
      return res.status(response.status).json({ error: data.error?.message || 'API request failed' });
    }

    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({ text: resultText.trim() });
  } catch (error) {
    console.error('Server Handler Error:', error);
    return res.status(500).json({ error: 'Failed to generate bio' });
  }
}
