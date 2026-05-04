const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'lib/i18n/dictionaries/de/tools');

// Remaining English words to fix
const fixes = {
  content: 'Inhalt',
  ' your ': ' Ihre ',
  ' the ': ' die ',
  ' and ': ' und ',
  ' or ': ' oder ',
  ' for ': ' für ',
  ' with ': ' mit ',
  ' from ': ' von ',
  ' to ': ' zu ',
  ' in ': ' in ',
  ' on ': ' auf ',
  ' at ': ' bei ',
  ' use ': ' verwenden ',
  ' click ': ' klicken ',
  ' enter ': ' eingeben ',
  ' paste ': ' einfügen ',
  ' copy ': ' kopieren ',
};

// Grammar improvements for common patterns
const grammarFixes = {
  // Fix verb placement
  'Eingeben Ihre Farbe': 'Geben Sie Ihre Farbe ein',
  'Eingeben oder einfügen jede Farbe Wert':
    'Geben Sie einen Farbwert ein oder fügen Sie ihn ein',
  'Kopieren und fügen Sie Ihre': 'Kopieren und fügen Sie Ihren',
  'Anzeigen alle Formate': 'Alle Formate anzeigen',
  'Generieren Farbe Paletten': 'Farbpaletten generieren',
  'Prüfen Barrierefreiheit': 'Barrierefreiheit prüfen',
  'Verwenden die': 'Verwenden Sie die',
  'Klicken jede Farbe': 'Klicken Sie auf jede Farbe',
  'Prüfen Kontrast': 'Kontrast prüfen',
  'Exportieren Ihre': 'Exportieren Sie Ihre',
  'Zugreifen Ihre': 'Greifen Sie auf Ihre',
  'Kopieren jede': 'Kopieren Sie jedes',

  // Fix noun gender/case
  'Ihre CSS-Code': 'Ihren CSS-Code',
  'Ihre content': 'Ihren Inhalt',
  'jede Farbe': 'jede Farbe',
  'alle Formate': 'alle Formate',

  // Fix phrases
  'Konvertieren Farben zwischen Formate':
    'Konvertieren Sie Farben zwischen Formaten',
  'Konvertieren nahtlos zwischen': 'Konvertieren Sie nahtlos zwischen',
  'Generieren harmonisch': 'Generieren Sie harmonische',
  'Erstellen Sie Tönungen': 'Erstellen Sie Tönungen',
};

function improveTranslation(text) {
  let improved = text;

  // Apply grammar fixes first (more specific)
  for (const [bad, good] of Object.entries(grammarFixes)) {
    improved = improved.replace(new RegExp(bad, 'g'), good);
  }

  // Then apply word-level fixes
  for (const [eng, de] of Object.entries(fixes)) {
    improved = improved.replace(new RegExp(eng, 'gi'), de);
  }

  return improved;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    // Recursively process all strings
    function processObject(obj) {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = improveTranslation(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          processObject(obj[key]);
        }
      }
    }

    processObject(data);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    console.log(`✅ Improved: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all tool files
const files = fs.readdirSync(toolsDir).filter((f) => f.endsWith('.json'));

console.log(`Processing ${files.length} files...\n`);

files.forEach((file) => {
  processFile(path.join(toolsDir, file));
});

console.log('\n✅ Final translation improvements complete!');
