const fs = require('fs');
try {
  const data = JSON.parse(fs.readFileSync('C:\\Users\\roman\\.gemini\\antigravity\\brain\\2e2b2efc-6857-418f-b730-06fd0f93c30b\\.system_generated\\steps\\776\\output.txt', 'utf8'));
  const proj = data.projects.find(p => p.title && p.title.includes('Workigom Mobile'));
  if (proj) {
    console.log('FOUND:', proj.name, proj.title);
  } else {
    console.log('Not found in data.projects');
    console.log('Titles:', data.projects.map(p => p.title).join(', '));
  }
} catch (e) {
  console.error(e);
}
