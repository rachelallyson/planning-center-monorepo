import { generateStaticParamsFor, importPage } from 'nextra/pages'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props) {
    const params = await props.params
    const { metadata } = await importPage(params?.mdxPath)
    return metadata
}

export default async function Page(props) {
    const params = await props.params
    const path = params?.mdxPath?.length ? params.mdxPath : undefined
    const {
        default: MDXContent,
        toc,
        metadata,
        sourceCode
    } = await importPage(path)

    return <MDXContent {...props} params={params} toc={toc} metadata={metadata} sourceCode={sourceCode} />
}
