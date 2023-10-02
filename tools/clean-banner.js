import { readFileSync, writeFileSync } from 'node:fs'

const readme = readFileSync('README.md', 'utf8')
writeFileSync(
  'README.md',
  readme.replace(
    '[![Pheno Agency](/banner.svg)](https://pheno.agency)\n\n',
    ''
  ),
  'utf8'
)
