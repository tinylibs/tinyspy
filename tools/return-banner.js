import { readFileSync, writeFileSync } from 'node:fs'

const readme = readFileSync('README.md', 'utf8')
writeFileSync(
  'README.md',
  '[![Pheno Agency](/banner.svg)](https://pheno.agency)\n\n' + readme,
  'utf8'
)
