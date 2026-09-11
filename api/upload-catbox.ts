import { Readable } from 'node:stream'
import type { IncomingMessage, ServerResponse } from 'node:http'

export const config = { runtime: 'nodejs20.x' }

const MAX_BYTES = 8 * 1024 * 1024

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function cleanFileName(name: string): string {
  const base = (name || 'product-image.jpg').split(/[\\/]/).pop() ?? 'product-image.jpg'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^_+|_+$/g, '')
  return cleaned.length > 60 ? cleaned.slice(-60) : (cleaned || 'product-image.jpg')
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const contentType = String(req.headers['content-type'] ?? '')
    if (!contentType.toLowerCase().includes('multipart/form-data')) {
      sendJson(res, 400, { message: 'يرجى إرسال صورة عبر multipart/form-data.' })
      return
    }

    const webReq = new Request('http://internal', {
      method: 'POST',
      headers: { 'content-type': contentType },
      body: Readable.toWeb(req),
    })
    const form = await webReq.formData()
    const file = form.get('file')
    if (!(file instanceof File) || file.size === 0) {
      sendJson(res, 400, { message: 'اختر صورة للمنتج أولاً.' })
      return
    }
    if (file.size > MAX_BYTES) {
      sendJson(res, 400, { message: 'حجم الصورة كبير جداً (الحد 8 ميجابايت).' })
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
      sendJson(res, 502, { message: 'فشل رفع الصورة إلى الاستضافة الخارجية.' })
      return
    }

    sendJson(res, 200, { url: text })
  } catch {
    sendJson(res, 500, { message: 'فشل رفع الصورة. حاول مرة أخرى.' })
  }
}