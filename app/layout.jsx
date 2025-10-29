import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import 'nextra-theme-docs/style.css'

export const metadata = {
    title: 'Planning Center API Clients',
    description: 'TypeScript client libraries for Planning Center Online APIs',
}

const navbar = <Navbar logo={<b>Planning Center API Clients</b>} />
const footer = <Footer>Planning Center API Clients © {new Date().getFullYear()} Rachel Allyson.</Footer>

export default async function RootLayout({ children }) {
    return (
        <html lang="en" dir="ltr" suppressHydrationWarning>
            <Head />
            <body>
                <Layout
                    navbar={navbar}
                    docsRepositoryBase="https://github.com/rachelallyson/planning-center-monorepo/blob/main"
                    footer={footer}
                >
                    {children}
                </Layout>
            </body>
        </html>
    )
}
