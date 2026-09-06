import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { Gem, MessageCircle, Phone, ArrowRight, Loader2 } from 'lucide-react'

import { getPublicProduct } from '@/features/products/api'
import {
  SITE_NAME,
  SITE_NAME_LATIN,
  SITE_PHONE_DISPLAY,
  SITE_PHONE_INTL,
  TEL_LINK,
  getSiteUrl,
  resolveProductImage,
  setJsonLd,
  setPageMeta,
} from '@/shared/lib/seo'
import { formatNumber } from '@/shared/lib/utils'

const WA_NUMBER = '201551702595'

function waLink(text: string): string {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`
}

export function PublicProductPage() {
  const { productId = '' } = useParams<{ productId: string }>()
  const [searchParams] = useSearchParams()
  const composedImage = searchParams.get('img') ?? ''

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public-product', productId],
    queryFn: () => getPublicProduct(Number(productId)),
    enabled: Number.isFinite(Number(productId)),
    retry: 1,
  })

  const baseUrl = `${getSiteUrl()}/products/${productId}`
  const shareUrl = composedImage ? `${baseUrl}?img=${encodeURIComponent(composedImage)}` : baseUrl
  const productImage = composedImage || resolveProductImage(product?.primaryImageUrl)

  useEffect(() => {
    if (!product) return
    const specs = [
      `الوزن ${formatNumber(product.weight)} جم`,
      `العيار ${product.karat}K`,
      product.size > 0 ? `مقاس ${product.size}` : null,
    ]
      .filter(Boolean)
      .join(' • ')
    const description =
      product.productDescription?.trim() ||
      `${product.productName} — ${specs}. للتواصل عبر واتساب: ${SITE_PHONE_DISPLAY}`

    setPageMeta({
      title: `${product.productName} — ${SITE_NAME}`,
      description,
      url: shareUrl,
      image: productImage || undefined,
      type: 'product',
    })

    const properties = [
      { '@type': 'PropertyValue', name: 'العيار', value: `${product.karat}K` },
      {
        '@type': 'PropertyValue',
        name: 'الوزن',
        value: `${formatNumber(product.weight)} جم`,
      },
    ]
    if (product.size > 0) {
      properties.push({
        '@type': 'PropertyValue',
        name: 'القياس',
        value: String(product.size),
      })
    }

    setJsonLd(`public-product-${product.productId}`, {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.productName,
      image: [productImage || ''],
      description,
      brand: { '@type': 'Brand', name: SITE_NAME_LATIN },
      additionalProperty: properties,
      offers: {
        '@type': 'Offer',
        availability:
          product.quantity > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
      },
    })
  }, [product, shareUrl, productImage])

  if (isLoading || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
        <Loader2 className="size-9 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">جارٍ تحميل المنتج...</p>
      </div>
    )
  }

  if (isError || !product || !Number.isFinite(Number(productId))) {
    return (
      <NotFoundCardShareLink />
    )
  }

  const available = product.quantity > 0

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
              <Gem className="h-5 w-5" />
            </span>
            <span className="text-xl font-bold">{SITE_NAME}</span>
          </Link>
          <a
            href={TEL_LINK}
            className="hidden items-center gap-2 rounded-full border border-black/10 bg-secondary/60 px-4 py-2 text-sm font-bold md:inline-flex"
          >
            <Phone className="size-4 text-primary" />
            {SITE_PHONE_DISPLAY}
          </a>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2 md:items-center">
          <div className="mx-auto w-full max-w-md">
            {productImage ? (
              <img
                src={productImage}
                alt={product.productName}
                className="aspect-square w-full rounded-[28px] border-4 border-white object-cover shadow-[0_18px_48px_rgba(8,10,30,0.28),0_4px_12px_rgba(8,10,30,0.12)] ring-1 ring-black/10"
              />
            ) : (
              <div className="grid aspect-square w-full place-items-center rounded-[28px] bg-secondary">
                <Gem className="size-16 text-muted-foreground/40" />
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-4">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                available ? 'bg-emerald-50 text-emerald-700' : 'bg-error/10 text-error'
              }`}
            >
              <span className={`size-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-error'}`} />
              {available ? 'متوفر حالياً' : 'نافد حالياً'}
            </span>

            <h1 className="text-2xl font-bold leading-[1.25] sm:text-3xl">
              {product.productName}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary">
                الوزن {formatNumber(product.weight)} جم
              </span>
              <span className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary">
                العيار {product.karat}K
              </span>
              {product.size > 0 && (
                <span className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm font-bold text-primary">
                  مقاس {product.size}
                </span>
              )}
            </div>

            {product.productDescription?.trim() && (
              <p className="leading-relaxed text-foreground/70">
                {product.productDescription}
              </p>
            )}
            {product.notes?.trim() && (
              <p className="text-sm text-foreground/55">{product.notes}</p>
            )}

            <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
              <a
                href={waLink(`مرحباً، أرغب في الاستفسار عن "${product.productName}"`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 font-bold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary/80"
              >
                <MessageCircle className="size-5" />
                استفسر عبر واتساب
              </a>
              <a
                href={TEL_LINK}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border-2 border-primary bg-white px-6 font-bold text-primary transition-colors hover:bg-primary/5"
              >
                <Phone className="size-5" />
                {SITE_PHONE_DISPLAY}
              </a>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowRight className="size-4" />
              تعرّف على {SITE_NAME} — نظام إدارة محلات الذهب
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-black/5 bg-[#0a0a0a] py-6 text-center text-xs text-[#cccccc]">
        <p>
          {SITE_NAME} — نظام ERP لإدارة محلات الذهب · للتواصل:{' '}
          <a href={TEL_LINK} dir="ltr" className="font-bold text-white">
            {SITE_PHONE_INTL}
          </a>
        </p>
      </footer>
    </div>
  )
}

function NotFoundCardShareLink() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-foreground">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-secondary">
        <Gem className="size-7 text-muted-foreground" />
      </span>
      <h1 className="text-xl font-bold">هذا المنتج غير متاح</h1>
      <p className="max-w-sm text-center text-muted-foreground">
        قد يكون الرابط غير صالح أو تم إيقاف المنتج. تصفّح صفحة {SITE_NAME} الرئيسية
        أو تواصل معنا مباشرة.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 font-bold text-white"
        >
          العودة للصفحة الرئيسية
        </Link>
        <a
          href={TEL_LINK}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full border-2 border-primary px-6 font-bold text-primary"
        >
          <Phone className="size-5" />
          {SITE_PHONE_DISPLAY}
        </a>
      </div>
    </div>
  )
}