// A tool's input, generated from its route's OpenAPI description (RFC 0099):
// the query and path parameters and the JSON body's fields, side by side in
// one object, with every `$ref` written out, because an assistant reads a
// tool's schema on its own, without the document's components beside it.

type Json = Record<string, unknown>

export interface InputSchema extends Json {
  type: 'object'
  properties: Record<string, Json>
  required?: string[]
}

/** Where each input field goes when the route is called. */
export interface InputPlan {
  query: string[]
  path: string[]
  body: string[]
}

function inline(node: unknown, doc: Json, seen: string[] = []): unknown {
  if (Array.isArray(node)) return node.map(n => inline(n, doc, seen))
  if (!node || typeof node !== 'object') return node
  const ref = (node as Json).$ref
  if (typeof ref === 'string') {
    if (seen.includes(ref)) throw new Error(`A tool's input refers to itself: ${ref}`)
    const target = ref.replace(/^#\//, '').split('/').reduce<unknown>((o, k) => (o as Json)?.[k], doc)
    return inline(target, doc, [...seen, ref])
  }
  return Object.fromEntries(Object.entries(node as Json).map(([k, v]) => [k, inline(v, doc, seen)]))
}

export function toolInput(
  doc: Json, method: string, path: string, omit: string[] = [],
): { schema: InputSchema; plan: InputPlan } {
  const op = ((doc.paths as Json)?.[path] as Json | undefined)?.[method] as Json | undefined
  if (!op) throw new Error(`No route ${method.toUpperCase()} ${path} in the API's description`)
  const properties: Record<string, Json> = {}
  const required: string[] = []
  const plan: InputPlan = { query: [], path: [], body: [] }

  for (const p of (op.parameters as Json[] | undefined) ?? []) {
    const param = inline(p, doc) as Json
    const name = param.name as string
    properties[name] = { ...(param.schema as Json), ...(param.description ? { description: param.description } : {}) }
    if (param.required) required.push(name)
    plan[param.in === 'path' ? 'path' : 'query'].push(name)
  }

  const body = ((op.requestBody as Json | undefined)?.content as Json | undefined)?.['application/json'] as Json | undefined
  if (body) {
    const schema = inline(body.schema, doc) as Json
    for (const [name, prop] of Object.entries((schema.properties as Record<string, Json>) ?? {})) {
      if (omit.includes(name)) continue
      properties[name] = prop
      plan.body.push(name)
    }
    for (const name of (schema.required as string[] | undefined) ?? []) {
      if (!omit.includes(name)) required.push(name)
    }
  }

  return { schema: { type: 'object', properties, ...(required.length ? { required } : {}) }, plan }
}
