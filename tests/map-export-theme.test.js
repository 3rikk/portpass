const assert = require('node:assert/strict');
const fs = require('node:fs');
const code = fs.readFileSync(require.resolve('../map-export.js'), 'utf8');

assert.match(code,/exportTheme/,'map export accepts an explicit export theme');
assert.match(code,/id = 'export-theme-controls'/,'share dialog injects export-only controls');
assert.match(code,/data-export-theme=\"light\"/,'export controls include light mode');
assert.match(code,/data-export-theme=\"dark\"/,'export controls include dark mode');
assert.match(code,/data-export-palette=\"\$\{key\}\"/,'export controls include accent swatches');
assert.match(code,/Only changes this JPEG\./,'export controls explain their local scope');
assert.match(code,/create\(\{\.\.\.lastRenderInput, exportTheme: exportChoice\}\)/,'theme changes regenerate the current JPEG');
assert.match(code,/navigator\.share\(\{files: \[customExportFile\]/,'native share uses the regenerated export file');
assert.match(code,/share-dialog-polished/,'share dialog gets compact export layout');
assert.match(code,/width:min\(920px,calc\(100vw - 32px\)\)/,'share dialog stays at a medium desktop width');
assert.match(code,/share-top-actions/,'download and share actions move into the dialog heading');
assert.match(code,/width:auto!important/,'top actions do not inherit full-width primary button styling');
assert.match(code,/share-dialog-hidden-copy/,'explanatory and status copy are visually removed from the dialog');
assert.match(code,/share-preview-frame/,'JPEG preview is wrapped in an image frame');
assert.match(code,/min-width:0;min-height:0;width:100%;overflow:hidden/,'preview frame constrains intrinsic image sizing');
assert.match(code,/max-height:min\(50dvh,460px\)/,'JPEG preview is constrained to a compact viewport height');
assert.match(code,/border:1px solid color-mix\(in srgb,var\(--ink\) 16%,var\(--line\)\)/,'JPEG preview has an image-like outline');
assert.doesNotMatch(code,/localStorage\.setItem\(['"]portpass-(?:theme|palette)/,'export controls do not write website theme preferences');
assert.doesNotMatch(code,/document\.documentElement\.dataset\.(?:theme|palette)\s*=/,'export controls do not mutate the website theme');

console.log('Map export theme controls passed: compact constrained JPEG dialog and export-only theme changes stay separate from site preferences.');
