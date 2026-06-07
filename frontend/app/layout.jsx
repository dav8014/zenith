import { Exo_2, Lato } from 'next/font/google'
import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

const exo2 = Exo_2({
  variable: '--font-exo2-var',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

const lato = Lato({
  variable: '--font-lato-var',
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
})

export const metadata = {
  title: {
    default: 'Zenith — Renting de Vehículos Premium',
    template: '%s | Zenith',
  },
  description:
    'Flota exclusiva de vehículos nacionales e importados en condiciones de renting inigualables.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${exo2.variable} ${lato.variable}`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}