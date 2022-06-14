import { redirect } from '@remix-run/node'
import { Link, useLoaderData, Form } from '@remix-run/react'
import { authorize } from '../../onedrive.server'

import { getImages, getMangaDetail, markChapter } from '../../utils/manga.server'

export async function action({ request, params: { series, chapterPath } }) {
  return await authorize(request, async ({ token }) => {
    const details = await getMangaDetail(token, series)
    const chapters = details.chapters.map(ch => ({ ...ch, realindex: ch.newIndex === null ? ch.index : ch.newIndex }))

    const action = (await request.formData()).get('action')
    const myChapter = chapters.find(ch => ch.path === chapterPath)

    if (action === 'prev-chapter') {
      const thresholdIndex = chapters.reduce(
        (pr, cu) => (cu.realindex > pr && cu.realindex < myChapter.realindex ? cu.realindex : pr),
        -1
      )

      markChapter(token, series, chapterPath, false)

      if (thresholdIndex === -1) {
        return redirect(`/manga/${series}`)
      } else {
        return redirect(`/manga/${series}/chapter/${chapters.filter(ch => ch.realindex === thresholdIndex)[0].path}`)
      }
    } else {
      const thresholdIndex = chapters.reduce(
        (pr, cu) => (cu.realindex < pr && cu.realindex > myChapter.realindex ? cu.realindex : pr),
        Number.MAX_SAFE_INTEGER
      )

      markChapter(token, series, chapterPath, true)

      if (thresholdIndex === Number.MAX_SAFE_INTEGER) {
        return redirect(`/manga/${series}`)
      } else {
        return redirect(`/manga/${series}/chapter/${chapters.filter(ch => ch.realindex === thresholdIndex)[0].path}`)
      }
    }
  })
}

export async function loader({ request, params: { series, chapterPath } }) {
  return await authorize(request, async ({ token }) => {
    const details = await getMangaDetail(token, series)
    return {
      images: (await getImages(token, series, chapterPath)).map(img => `/manga/image/${series}/${chapterPath}/${img}`),
      details,
      chapter: details.chapters.filter(ch => ch.path === chapterPath)[0]
    }
  })
}

export default function Index() {
  const { images, details, chapter } = useLoaderData()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>{details.meta.name}</h1>
      <h2>{chapter.meta.name}</h2>
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
        <input type='submit' value='< Previous Chapter' />
      </Form>
      <Link to={`/manga/${details.request.slug}`}>Back to {details.meta.name}</Link>
      <Form method='POST'>
        <input type='hidden' name='action' value='next-chapter' />
        <input type='submit' value='> Next Chapter' />
      </Form>
    </div>
  )
}
