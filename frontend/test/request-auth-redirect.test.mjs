import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

async function loadRequestModule() {
  const outdir = mkdtempSync(join(tmpdir(), 'request-auth-redirect-'))
  const outfile = join(outdir, 'request.mjs')
  const sourcePath = resolve('frontend/src/api/request.ts')
  const source = await readFile(sourcePath, 'utf8')
  const axiosStub = `const axios = {
  create() {
    return {
      interceptors: {
        request: { use() {} },
        response: { use() {} }
      }
    }
  }
}`
  const transformed = ts.transpileModule(
    source
      .replace("import axios from 'axios'", axiosStub)
      .replaceAll('import.meta.env.VITE_API_BASE_URL', 'undefined'),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        importsNotUsedAsValues: ts.ImportsNotUsedAsValues.Remove
      },
      fileName: sourcePath
    }
  )

  await import('node:fs/promises').then(({ writeFile }) => writeFile(outfile, transformed.outputText))

  return import(pathToFileURL(outfile).href)
}

test('login endpoint 401 does not trigger login redirect', async () => {
  const { shouldRedirectToLoginOnUnauthorized } = await loadRequestModule()

  assert.equal(typeof shouldRedirectToLoginOnUnauthorized, 'function')
  assert.equal(
    shouldRedirectToLoginOnUnauthorized({
      response: { status: 401 },
      config: { url: '/auth/login' }
    }),
    false
  )
})

test('protected endpoint 401 still triggers login redirect', async () => {
  const { shouldRedirectToLoginOnUnauthorized } = await loadRequestModule()

  assert.equal(
    shouldRedirectToLoginOnUnauthorized({
      response: { status: 401 },
      config: { url: '/users/me' }
    }),
    true
  )
})
