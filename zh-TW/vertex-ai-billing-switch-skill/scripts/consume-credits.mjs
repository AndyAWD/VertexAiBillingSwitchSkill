import { execSync } from 'child_process';

const PROJECT_ID = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
const LOCATION = 'us-central1';
const MODEL_ID = 'gemini-3.1-pro-preview';

/**
 * 使用 gcloud 直接呼叫 Vertex AI API 以消耗額度
 * 使用 Gemini 3.1 Pro 以加速消耗額度。
 */
async function consume() {
  console.log('🚀 開始消耗額度測試...');
  
  // 建立一段約 10,000 Token 的文本 (重複字串)
  const longText = 'This is a test to consume credits. '.repeat(2000);
  
  const payload = {
    contents: [{
      role: 'user',
      parts: [{ text: `Please summarize this long text multiple times to generate high output tokens: ${longText}` }]
    }],
    generationConfig: {
      maxOutputTokens: 8192,
    }
  };

  let count = 0;
  while (true) {
    try {
      count++;
      console.log(`[${new Date().toLocaleTimeString()}] 正在發送第 ${count} 次大型請求...`);
      
      const response = execSync(
        `curl -X POST \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "Content-Type: application/json; charset=utf-8" \
        -d '${JSON.stringify(payload)}' \
        "https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent"`,
        { stdio: 'pipe' }
      ).toString();

      if (response.includes('BILLING_DISABLED') || response.includes('402') || response.includes('Quota exceeded')) {
        console.log('🎯 額度已耗盡！偵測到帳單錯誤。');
        break;
      }
    } catch (error) {
      const errMsg = error.stderr?.toString() || error.message;
      if (errMsg.includes('402') || errMsg.includes('Quota')) {
        console.log('🎯 成功觸發額度耗盡錯誤。');
        break;
      }
      console.error('❌ 請求失敗:', errMsg);
      // 如果是因為 token 過多或網路問題，稍等再試
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

consume();
