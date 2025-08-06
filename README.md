# Minimal Waitlist
![Frame 302](https://github.com/user-attachments/assets/647a0084-362c-4e55-a677-f78d5722eab5)

Minimal Waitlist Page with Discord Webhooks and Cloudflare Turnstile Bot Protection

## 🛡️ Cloudflare Turnstile Setup

This project includes Cloudflare Turnstile for bot protection. Follow these steps to set it up properly:

### 1. Get Turnstile Keys

1. Go to the [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Turnstile** in the sidebar
3. Click **Add widget**
4. Fill in:
   - **Site name**: Your waitlist name
   - **Hostname**: Your domain (e.g., `example.com`)
   - **Widget mode**: Choose based on your needs
     - **Managed**: Recommended for most cases
     - **Non-interactive**: Invisible to users
     - **Invisible**: Completely invisible
5. Copy your **Site Key** and **Secret Key**

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```bash
# Cloudflare Turnstile (Bot Protection)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"  # Your site key (public)
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"  # Your secret key (private)
```

### 4. Testing

For testing, you can use Cloudflare's test keys:

```bash
# Test Site Key (always passes)
NEXT_PUBLIC_TURNSTILE_SITE_KEY="1x00000000000000000000AA"

# Test Secret Key (always passes)  
TURNSTILE_SECRET_KEY="1x0000000000000000000000000000000AA"
```

### How to import to zerops
Go to zerops dashboard and import this project:

```yml
project:
  name: Minimal Waitlist
services:
  - hostname: app
    type: nodejs@20
    buildFromGit: https://github.com/ColdranAI/waitlist-starter
    enableSubdomainAccess: true

  - hostname: redis
    type: valkey@7.2
    mode: NON_HA
    priority: 10

  - hostname: db
    type: postgresql@16
    mode: NON_HA
    priority: 10
```

You can assign these environment variable in the service dashboard.

```bash
DISCORD_WEBHOOK_URL: https://discord.gg/w
NEXT_PUBLIC_TURNSTILE_SITE_KEY: 0x4AAAAAABmUsOaGja-PzTWf
TURNSTILE_SECRET_KEY: 0x4AAAAAABmUsAvdqLCS8hWpQMxp5x3EXMA
NEXT_PUBLIC_DISCORD_INVITE: https://discord.gg/vnReNt4J7T
```

Make sure to create and copy your webhook URL from your Discord server:

Go to your server settings.
Navigate to the desired text channel.
Open 'Integrations' > 'Webhooks'.
Create a new webhook and copy the webhook URL.

### How to export emails to json in discord channel

1. Go to your waitlist channel on your browser and open developer tools and paste the code block in console.
   
```javascript
const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const allText = document.body.innerText;

const emails = new Set(allText.match(emailRegex));

const emailArray = Array.from(emails);
const emailJSON = JSON.stringify(emailArray, null, 2);

const blob = new Blob([emailJSON], { type: 'application/json' });
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = 'waitlist-emails.json';
link.click();

console.log("Waitlist exported!!", emailArray);

```
