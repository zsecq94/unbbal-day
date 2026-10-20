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
  const [{ meta }, locale] = await Promise.all([getDictionary(), getLocale()])
  return {
    title: meta.title,
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
