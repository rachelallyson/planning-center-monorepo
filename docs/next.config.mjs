import nextra from 'nextra'

const withNextra = nextra({
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

