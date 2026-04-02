import { execSync } from 'child_process';

const PROJECT_ID = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
const LOCATION = 'us-central1';
const MODEL_ID = 'gemini-3.1-pro-preview';

/**
 * Use gcloud to call Vertex AI API directly to consume credits.
 * Uses Gemini 3.1 Pro to consume credits faster.
 */
async function consume() {
  console.log('🚀 Starting credit consumption test...');

  // Create a ~10,000 token text (repeated string)
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
      console.log(`[${new Date().toLocaleTimeString()}] Sending large request #${count}...`);

      const response = execSync(
        `curl -X POST \
        -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        -H "Content-Type: application/json; charset=utf-8" \
        -d '${JSON.stringify(payload)}' \
        "https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent"`,
        { stdio: 'pipe' }
      ).toString();

      if (response.includes('BILLING_DISABLED') || response.includes('402') || response.includes('Quota exceeded')) {
        console.log('🎯 Credits exhausted! Billing error detected.');
        break;
      }
    } catch (error) {
      const errMsg = error.stderr?.toString() || error.message;
      if (errMsg.includes('402') || errMsg.includes('Quota')) {
        console.log('🎯 Successfully triggered credit exhaustion error.');
        break;
      }
      console.error('❌ Request failed:', errMsg);
      // If it's a token overflow or network issue, wait and retry
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

consume();
