import { redirect } from '@remix-run/node'
import { Link, useLoaderData, Form } from '@remix-run/react'
import { authorize } from '../../onedrive.server'

import { getImages, getMangaDetail, markChapter, getNextChapter, getPreviousChapter } from '../../utils/manga.server'

export async function action({ request, params: { series, chapterPath } }) {
  return await authorize(request, async () => {
    const formData = await request.formData(),
      action = formData.get('action'),
      chapterId = formData.get('chapter-id')

    const targetChapter =
      action === 'prev-chapter'
        ? await getPreviousChapter(series, chapterPath)
        : await getNextChapter(series, chapterPath)

    await markChapter(chapterId, action === 'next-chapter')
    if (targetChapter === null) {
      return redirect(`/manga/${series}`)
    } else {
      return redirect(`/manga/${series}/chapter/${targetChapter.chapterPath}`)
    }
  })
}

export async function loader({ request, params: { series, chapterPath } }) {
  return await authorize(request, async ({ token }) => {
    const { details, chapters } = await getMangaDetail(series)
    return {
      images: (await getImages(token, series, chapterPath)).map(img => `/manga/image/${series}/${chapterPath}/${img}`),
      details,
      chapter: chapters.filter(ch => ch.chapterPath === chapterPath)[0]
    }
  })
}

export default function Index() {
  const { images, details, chapter } = useLoaderData()

  const scrollUp = () => window.scrollTo(0, 0)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>{details.meta.name}</h1>
      <h2>{chapter.name}</h2>
      <Link to={`/manga/${details.request.slug}`}>Back to manga listing</Link>
      <hr />
      {images.map((imgSrc, index) => (
        <>
          <img key={index} src={imgSrc} alt='Manga chapter' />
          <br />
        </>
      ))}
      <hr />
      <Form method='POST'>
        <input type='hidden' name='action' value='prev-chapter' />
        <input type='hidden' name='chapter-id' value={chapter._id} />
        <input type='submit' value='< Previous Chapter' onClick={scrollUp} />
      </Form>
      <Link to={`/manga/${details.request.slug}`}>Back to {details.meta.name}</Link>
      <Form method='POST'>
        <input type='hidden' name='action' value='next-chapter' />
        <input type='hidden' name='chapter-id' value={chapter._id} />
        <input type='submit' value='> Next Chapter' onClick={scrollUp} />
      </Form>
    </div>
  )
}
