import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Providers } from './providers'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: 'Planning Center API Clients',
  description: 'TypeScript client libraries for Planning Center Online APIs',
}

function normalizePageMap(pageMap) {
  if (!pageMap) return pageMap
  if (Array.isArray(pageMap)) {
    return pageMap.map(item => {
      if (typeof item === 'string') {
        return item.startsWith('/content') ? item.replace('/content', '') : item
      }
      if (item && typeof item === 'object') {
        return {
          ...item,
          route: item.route?.startsWith('/content') ? item.route.replace('/content', '') : item.route,
          children: item.children ? normalizePageMap(item.children) : undefined
        }
      }
      return item
    })
  }
  return pageMap
}

const navbar = <Navbar logo={<b>Planning Center API Clients</b>} />
const footer = <Footer>Planning Center API Clients © {new Date().getFullYear()} Rachel Allyson.</Footer>

export default async function RootLayout({ children }) {
  const pageMap = await getPageMap()
  const normalizedPageMap = normalizePageMap(pageMap)

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Providers>
          <Layout
            navbar={navbar}
            pageMap={normalizedPageMap}
            docsRepositoryBase="https://github.com/rachelallyson/planning-center-monorepo/blob/main/docs/content"
            footer={footer}
          >
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  )
}

