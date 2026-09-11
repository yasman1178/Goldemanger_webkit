export const config = { runtime: 'nodejs', bodyParser: false }

const MAX_BYTES = 8 * 1024 * 1024

type ResLike = {
  statusCode: number
  setHeader(name: string, value: string): void
  end(body?: unknown): void
}

type ReqLike = {
  headers: Record<string, string | string[] | undefined>
  on(event: 'data', cb: (chunk: Uint8Array) => void): void
  on(event: 'end', cb: () => void): void
  on(event: 'error', cb: (err: unknown) => void): void
}

function sendJson(res: ResLike, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function cleanFileName(name: string): string {
  const base = (name || 'product-image.jpg').split(/[\\/]/).pop() ?? 'product-image.jpg'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+|_+$/g, '')
  return cleaned.length > 60 ? cleaned.slice(-60) : (cleaned || 'product-image.jpg')
}

function readBody(req: ReqLike): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = []
    let size = 0
    req.on('data', (chunk) => {
      chunks.push(chunk)
      size += chunk.byteLength
    })
    req.on('end', () => {
      const merged = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) {
        merged.set(chunk, offset)
        offset += chunk.byteLength
      }
      resolve(merged)
    })
    req.on('error', reject)
  })
}

export default async function handler(req: unknown, res: unknown) {
  const response = res as ResLike
  const request = req as ReqLike
  try {
    const contentType = String(request.headers['content-type'] ?? '')
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      sendJson(response, 400, { message: 'يرجى إرسال صورة عبر multipart/form-data.' })
      return
    }

    const raw = await readBody(request)
    if (raw.byteLength === 0) {
      sendJson(response, 400, { message: 'اختر صورة للمنتج أولاً.' })
      return
    }

    const webReq = new Request('http://internal', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: raw,
    })
    const form = await webReq.formData()
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      sendJson(response, 400, { message: 'اختر صورة للمنتج أولاً.' })
      return
    }
    if (file.size > MAX_BYTES) {
      sendJson(response, 400, { message: 'حجم الصورة كبير جداً (الحد 8 ميجابايت).' })
      return
    }

    const out = new FormData()
    out.set('reqtype', 'fileupload')
    out.set('fileToUpload', new File([file], cleanFileName(file.name), { type: file.type || 'image/jpeg' }))

    const upstream = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: out,
      redirect: 'follow',
      headers: { 'user-agent': 'GoldMaster-Vercel/1.0 (goldmaster)' },
    })
    const text = (await upstream.text()).trim()

    if (!upstream.ok || !/^https:\/\/files\.catbox\.moe\//i.test(text)) {
      sendJson(response, 502, { message: 'فشل رفع الصورة إلى الاستضافة الخارجية (Catbox).' })
      return
    }

    sendJson(response, 200, { url: text })
  } catch {
    sendJson(response, 500, { message: 'فشل رفع الصورة. حاول مرة أخرى.' })
  }
}