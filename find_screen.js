const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('C:\\Users\\roman\\.gemini\\antigravity\\brain\\2e2b2efc-6857-418f-b730-06fd0f93c30b\\.system_generated\\steps\\798\\output.txt', 'utf8'));
  const screen = data.screens.find(s => s.title && s.title.includes('Profil'));
  if (screen) {
    console.log('FOUND:', screen.name, screen.title);
  } else {
    console.log('Not found');
  }
} catch (e) {
  console.error(e);
}
