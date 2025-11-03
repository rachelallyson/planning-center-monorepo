import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  search: { codeblocks: false }
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/planning-center-monorepo' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/planning-center-monorepo' : ''
}

export default withNextra(nextConfig)

