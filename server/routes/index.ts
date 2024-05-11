import { nanoid } from 'nanoid'
import { EchoResponse, EchoResponseMetaBodyType } from '../types/EchoResponse'

const METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH', 'DELETE']

export default defineEventHandler(async (event) => {
  if (
    event.method === 'GET' &&
    event.node.req.url === '/' &&
    event.headers.get('accept')?.includes('text/html') &&
    event.headers.get('accept') !== '*/*'
  ) {
    console.log('[redirect] / -> /_index.html')
    return sendRedirect(event, '/_index.html')
  }

  const starttime = Date.now()
  const id = nanoid()
  const FORM_DATA_FLAG = new URL(`form-data://${id}/`)
  const BINARY_FILES_FLAG = new URL(`binnary-files://${id}/`)
  const url = getRequestURL(event)
  const method = event.method
  const { values: headers } = await transformKeyValStructure(event.headers, BINARY_FILES_FLAG)

  let bodyType: EchoResponseMetaBodyType = EchoResponseMetaBodyType.NOT_ACCEPTABLE
  let body: any = null
  let formData: Record<string, string | string[]> | null = null
  let contentType = event.headers.get('content-type') || ''
  let binaryFiles: any[] = []

  // Process searchParams
  const { values: searchParams } = await transformKeyValStructure(url.searchParams, BINARY_FILES_FLAG)

  // Handle request body
  if (METHODS_WITH_BODY.includes(method)) {
    // JSON-like
    if (contentType.startsWith('application/json')) {
      bodyType = EchoResponseMetaBodyType.JSON
      body = await readBody(event)
    }
    // Text-like
    else if (
      contentType.startsWith('text/') ||
      contentType.startsWith('application/javascript') ||
      contentType.startsWith('application/xml') ||
      contentType.startsWith('application/xhtml+xml') ||
      contentType.startsWith('application/rss+xml') ||
      contentType.startsWith('application/atom+xml') ||
      contentType.startsWith('application/svg+xml') ||
      contentType.startsWith('application/x-sh') ||
      contentType.startsWith('application/x-shockwave-flash') ||
      contentType.startsWith('application/ld+json')
    ) {
      bodyType = EchoResponseMetaBodyType.TEXT
      body = (await readBody(event)) ?? ''
    }
    // FormData or URLSearchParams
    else if (contentType.startsWith('multipart/form-data') || contentType.startsWith('application/x-www-form-urlencoded')) {
      bodyType = EchoResponseMetaBodyType.FORM
      const data = await readFormData(event)
      body = FORM_DATA_FLAG
      const { values, files } = await transformKeyValStructure(data, BINARY_FILES_FLAG)
      formData = values
      binaryFiles.push(...files)
    }
    // Blob-like
    else if (
      contentType.startsWith('image/') ||
      contentType.startsWith('video/') ||
      contentType.startsWith('audio/') ||
      contentType.startsWith('application/')
    ) {
      bodyType = EchoResponseMetaBodyType.BINARY
      const buf = await readRawBody(event, false)
      const blob = new Blob([buf], { type: contentType })
      const info = await getFileInfoFromBlob(blob)
      body = new URL(`/${info.id}`, BINARY_FILES_FLAG).href
      binaryFiles.push(info)
    }
    // Unknown
    else {
      body = (await readBody(event)) ?? null
      bodyType = body === null ? EchoResponseMetaBodyType.EMPTY : EchoResponseMetaBodyType.UNKNOWN
    }
  }

  const endtime = Date.now()

  const responseBody: EchoResponse = {
    id,
    method,
    url: url.href,
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    search: url.search,
    searchParams,
    headers,
    body,
    formData,
    binaryFiles,
    _meta: {
      starttime,
      endtime,
      duration: endtime - starttime,
      bodyType,
      FORM_DATA_FLAG: FORM_DATA_FLAG.href,
      BINARY_FILES_FLAG: BINARY_FILES_FLAG.href,
    },
  }

  return Response.json(responseBody, {
    status: 200,
    headers: {
      'access-control-allow-origin': '*', // CORS
      'content-type': 'application/json; charset=utf-8',
    },
  })
})
