const fs = require('fs');
const path = require('path');
const dir = 'blueprints';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'manifest.js');

let totalFails = 0;
files.forEach(f => {
    const content = fs.readFileSync(path.join(dir, f), 'utf8');
    if (content.includes('${i}') || content.includes('${tier}') || content.includes('${s.')) {
        console.log(`FAIL [${f}]: Contains un-evaluated variable!`);
        totalFails++;

        // Find exact lines
        const lines = content.split('\n');
        lines.forEach((l, i) => {
            if (l.includes('${i}') || l.includes('${tier}') || l.includes('${s.')) {
                console.log(`  Line ${i + 1}: ${l.trim()}`);
            }
        });
    }
});

if (totalFails === 0) {
    console.log('SUCCESS: All 20 blueprints look clean.');
} else {
    console.log(`FAILED: ${totalFails} blueprints are corrupted.`);
}
