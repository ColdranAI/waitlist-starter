# Minimal Waitlist
![Frame 302](https://github.com/user-attachments/assets/647a0084-362c-4e55-a677-f78d5722eab5)

Minimal Waitlist Page with Discord Webhooks

## How to import to zerops
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
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1402505825284784199/rNID32_cyYjHvyiNmuKTrOXd75iAuE-T32kHCJEztcDhYk4ql4cp_G8Ix7QQXDJgVq-M
NEXT_PUBLIC_DISCORD_INVITE=https://discord.gg/rDDqA83eGz
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
