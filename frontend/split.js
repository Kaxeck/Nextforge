const fs = require('fs');
const appTsx = fs.readFileSync('src/App.tsx', 'utf8');
const lines = appTsx.split('\n');
const startIndex = lines.findIndex(l => l.includes('{/* MAIN */}'));
const endIndex = lines.findIndex(l => l.includes('export default App;')) - 3; 
let marketplaceContent = lines.slice(startIndex, endIndex).join('\n');
const template = `import { useState } from "react";\n\nexport function Marketplace() {\n  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);\n\n  return (\n    <>\n${marketplaceContent}\n    </>\n  );\n}\n`;
fs.writeFileSync('src/pages/Marketplace.tsx', template);
