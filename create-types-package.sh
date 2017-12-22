#!/usr/bin/env bash

set -e

mkdir -p _types
tsc -p ./tsconfig.json -m system --outFile ./_types/typings.js
unlink ./_types/typings.js

npm run compile

tar -cf - `find -path ./node_modules -prune -o -path ./_types -prune -o -name "*.d.ts" -print` | tar -x -C _types

echo "const {writeFileSync} = require('fs');
const p = require('./package.json');
const devDependencies = {};
for (const name of Object.keys(p.devDependencies)) {
    if (/^@types\//.test(name)) devDependencies[name] = p.devDependencies[name];
}
const pkg = {
    name: p.name + '.typings',
    version: p.version,
    typings: p.main.replace(/\.js$/, '.d.ts'),
    devDependencies: devDependencies,
    keywords: [].concat(p.keywords, 'typings'),
    repository: p.repository,
    scripts: {
        postinstall: ''
    }
};
writeFileSync('./_types/package.json', JSON.stringify(pkg, null, 4));
writeFileSync('./_types/README.md', \`
# This package is typings for \\\`\${p.name}\\\`
\`);
" | node
