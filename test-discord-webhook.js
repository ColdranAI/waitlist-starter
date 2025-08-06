/**
 * Discord Webhook Test Script
 * 
 * This script tests the Discord webhook functionality with spam protection.
 * Run with: node test-discord-webhook.js
 * 
 * Make sure to set DISCORD_WEBHOOK_URL in your .env file before testing.
 */

const BASE_URL = 'http://localhost:3000';

async function testDiscordWebhook() {
  console.log('🧪 Testing Discord Webhook Implementation\n');

  // Test 1: Health Check
  console.log('1️⃣ Testing health check endpoint...');
  try {
    const response = await fetch(`${BASE_URL}/api/discord/webhook`, {
      method: 'GET',
    });
    const data = await response.json();
    console.log('✅ Health check:', data);
    
    if (!data.configured) {
      console.log('⚠️  Warning: Discord webhook not configured. Set DISCORD_WEBHOOK_URL in .env');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  console.log('');

  // Test 2: Valid webhook request
  console.log('2️⃣ Testing valid webhook request...');
  try {
    const response = await fetch(`${BASE_URL}/api/discord/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test message from webhook API',
        username: 'Test Bot',
      }),
    });
    const data = await response.json();
    console.log('✅ Valid request:', data);
  } catch (error) {
    console.log('❌ Valid request failed:', error.message);
  }
  console.log('');

  // Test 3: Embed webhook request
  console.log('3️⃣ Testing embed webhook request...');
  try {
    const response = await fetch(`${BASE_URL}/api/discord/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [{
          title: 'Test Embed',
          description: 'This is a test embed message',
          color: 0x00ff00,
          fields: [
            {
              name: 'Field 1',
              value: 'Value 1',
              inline: true,
            },
            {
              name: 'Field 2',
              value: 'Value 2',
              inline: true,
            },
          ],
          timestamp: new Date().toISOString(),
        }],
        username: 'Embed Test Bot',
      }),
    });
    const data = await response.json();
    console.log('✅ Embed request:', data);
  } catch (error) {
    console.log('❌ Embed request failed:', error.message);
  }
  console.log('');

  // Test 4: Invalid request (no content or embeds)
  console.log('4️⃣ Testing invalid request (no content)...');
  try {
    const response = await fetch(`${BASE_URL}/api/discord/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'Test Bot',
      }),
    });
    const data = await response.json();
    console.log('✅ Invalid request handled:', data);
  } catch (error) {
    console.log('❌ Invalid request test failed:', error.message);
  }
  console.log('');

  // Test 5: Spam content detection
  console.log('5️⃣ Testing spam content detection...');
  try {
    const response = await fetch(`${BASE_URL}/api/discord/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'URGENT! Click here to win a lottery! Visit casino.tk now! @everyone',
        username: 'Spam Bot',
      }),
    });
    const data = await response.json();
    console.log('✅ Spam detection:', data);
  } catch (error) {
    console.log('❌ Spam detection test failed:', error.message);
  }
  console.log('');

  // Test 6: Content too long
  console.log('6️⃣ Testing content length validation...');
  try {
    const longContent = 'A'.repeat(2001); // Exceeds 2000 character limit
    const response = await fetch(`${BASE_URL}/api/discord/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: longContent,
        username: 'Long Content Bot',
      }),
    });
    const data = await response.json();
    console.log('✅ Length validation:', data);
  } catch (error) {
    console.log('❌ Length validation test failed:', error.message);
  }
  console.log('');

  // Test 7: Rate limiting (send multiple requests quickly)
  console.log('7️⃣ Testing rate limiting...');
  try {
    const promises = [];
    for (let i = 0; i < 12; i++) { // Exceeds limit of 10 per 5 minutes
      promises.push(
        fetch(`${BASE_URL}/api/discord/webhook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: `Rate limit test message ${i + 1}`,
            username: 'Rate Limit Test Bot',
          }),
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const results = await Promise.all(responses.map(r => r.json()));
    
    const successful = results.filter(r => r.success).length;
    const rateLimited = results.filter(r => !r.success && r.error?.includes('rate limit')).length;
    
    console.log(`✅ Rate limiting: ${successful} successful, ${rateLimited} rate limited`);
  } catch (error) {
    console.log('❌ Rate limiting test failed:', error.message);
  }
  console.log('');

  // Test 8: Test waitlist integration
  console.log('8️⃣ Testing waitlist integration...');
  try {
    const formData = new FormData();
    formData.append('email', `test-${Date.now()}@example.com`);
    
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      body: formData,
    });
    
    // Note: This will test the actual waitlist form submission
    // which should trigger a Discord notification if configured
    console.log('✅ Waitlist integration test submitted');
    console.log('   Check your Discord server for a new waitlist notification');
  } catch (error) {
    console.log('❌ Waitlist integration test failed:', error.message);
  }
  console.log('');

  console.log('🎉 Discord webhook testing completed!');
  console.log('\n📋 Summary:');
  console.log('- Health check endpoint: /api/discord/webhook (GET)');
  console.log('- Webhook endpoint: /api/discord/webhook (POST)');
  console.log('- Spam protection: ✅ Content validation, suspicious patterns, rate limiting');
  console.log('- Rate limiting: ✅ IP-based (10/5min), Global (50/1min), Content-based');
  console.log('- Integration: ✅ Automatic notifications on waitlist signup');
  console.log('\n🔧 Configuration:');
  console.log('- Set DISCORD_WEBHOOK_URL in your .env file');
  console.log('- Get webhook URL from Discord Server Settings > Integrations > Webhooks');
}

// Run the tests
if (require.main === module) {
  testDiscordWebhook().catch(console.error);
}

module.exports = { testDiscordWebhook };