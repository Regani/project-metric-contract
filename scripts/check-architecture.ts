import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import ts from 'typescript'

// Generated adapters are checked by regeneration, never by handwritten-code rules.
const excluded = new Set(['node_modules', '.git', '.scratch', '.agents', '.codex', 'generated'])
async function inspect(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name)
    assert.doesNotMatch(entry.name, /(?:\.sql$|^migrations?$|^legacy$)/i, `Obsolete persistence artifact: ${file}`)
    if (entry.isDirectory()) {
      if (!excluded.has(entry.name)) await inspect(file)
    } else if (entry.name.endsWith('.ts')) {
      const text = await readFile(file, 'utf8')
      assert.doesNotMatch(text, /@ts-(?:ignore|expect-error)/, file)
      const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
      function visit(node: ts.Node) {
        assert.ok(!ts.isAsExpression(node) && !ts.isTypeAssertionExpression(node)
          && !ts.isNonNullExpression(node) && node.kind !== ts.SyntaxKind.AnyKeyword
          && node.kind !== ts.SyntaxKind.UnknownKeyword, `Unsafe type claim: ${file}`)
        assert.ok(!ts.isInterfaceDeclaration(node) && !ts.isTypeAliasDeclaration(node), `Contract types must be generated: ${file}`)
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
          assert.ok(!['parse', 'safeParse', 'query', 'execute', 'exec'].includes(node.expression.name.text), `Manual parsing or raw persistence: ${file}`)
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
  }
}
await inspect('.')
console.log('Architecture: no handwritten contract types, unsafe typing, manual parsing or persistence artifacts')
