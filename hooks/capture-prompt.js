const fs = require('fs');
const path = require('path');

let data = '';
process.stdin.on('data', chunk => { data += chunk; });
process.stdin.on('end', () => {
  if (!data) return;
  try {
    const parsed = JSON.parse(data);
    const output = {
      prompt: parsed.prompt || '',
      cwd: parsed.cwd || '',
      time: new Date().toISOString()
    };
    fs.writeFileSync(
      path.join(process.env.TEMP || '.', 'cc-notify-last-prompt.json'),
      JSON.stringify(output, null, 2),
      'utf-8'
    );
  } catch (e) {
    // ignore parse errors
  }
});
