/**
 * Workers Echo Server
 * @author dragon-fish <dragon-fish@qq.com>
 * @license MIT
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { EchoResponse } from './types/EchoResponse'
import { safelyStringify } from './utils/safelyStringify'
import { getFileInfoFromBlob } from './utils/getFileInfoFromBlob'

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const uuid = crypto.randomUUID()
    const FORM_DATA_SIGNAL = `#FORM_DATA#${uuid}#`
    const BINARY_FILES_SIGNAL = `#BINARY_FILES#${uuid}#`
    const { protocol, origin, hostname, pathname, searchParams } = new URL(request.url)
    const method = request.method.toUpperCase()
    const headers = Object.fromEntries(request.headers.entries())

    let body = undefined
    let formData = undefined
    let binaryFiles = []
    let contentType = request.headers.get('content-type') || ''

    let BODY_TYPE = 'UNKNOWN'
    // JSON-like
    if (contentType.startsWith('application/json')) {
      BODY_TYPE = 'JSON'
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
      BODY_TYPE = 'TEXT'
    }
    // Form-like
    else if (contentType.startsWith('multipart/form-data') || contentType.startsWith('application/x-www-form-urlencoded')) {
      BODY_TYPE = 'FORM'
    }
    // Blob-like
    else if (
      contentType.startsWith('image/') ||
      contentType.startsWith('video/') ||
      contentType.startsWith('audio/') ||
      contentType.startsWith('application/')
    ) {
      BODY_TYPE = 'BLOB'
    }

    switch (BODY_TYPE) {
      case 'JSON': {
        body = await request.json()
        break
      }
      case 'FORM': {
        const formObject: Record<string, string> = {}
        for (const [key, value] of await request.formData()) {
          if ((value as any) instanceof Blob) {
            const info = await getFileInfoFromBlob(value as any)
            binaryFiles.push(info)
            formObject[key] = `${BINARY_FILES_SIGNAL}${info.uuid}`
          } else {
            formObject[key] = value
          }
        }
        formData = formObject
        body = FORM_DATA_SIGNAL
        break
      }
      case 'BLOB': {
        const blob = await request.blob()
        const info = await getFileInfoFromBlob(blob)
        binaryFiles.push(info)
        body = `${BINARY_FILES_SIGNAL}${info.uuid}`
        break
      }
      default: {
        body = (await request.text()) || undefined
        break
      }
    }

    const data: EchoResponse = {
      uuid,
      method: method as any,
      url: request.url,
      protocol,
      pathname,
      origin,
      hostname,
      searchParams: Object.fromEntries(searchParams.entries()),
      headers,
      body,
      formData,
      binaryFiles,
    }

    return new Response(safelyStringify(data), {
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    })
  },
}
