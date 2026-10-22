import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import 'wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css'
import { LOCALES } from '@/lib/i18n'
import '../globals.css'
import { getDictionary, getLocale } from './dictionaries'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export async function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }))
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ meta, brand }, locale] = await Promise.all([
    getDictionary(),
    getLocale(),
  ])
  return {
    // 하위 페이지(게임)는 이름만 제목으로 두고, 브랜드명은 여기서 뒤에 붙인다.
    title: { default: meta.title, template: `%s · ${brand.name}` },
    description: meta.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `/${l}`])),
    },
  }
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  colorScheme: 'dark',
}

export default async function RootLayout({ children }: LayoutProps<'/[lang]'>) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
