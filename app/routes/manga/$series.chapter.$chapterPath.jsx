import { redirect } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { authorize } from '../../onedrive.server'

import { getImages, getMangaDetail } from '../../utils/manga.server'

export async function action({ request, params: { series, chapterPath } }) {
  return await authorize(request, async ({ token }) => {
    const details = await getMangaDetail(token, series)
    const chapters = details.chapters.map(ch => ({ ...ch, realindex: ch.newIndex === null ? ch.index : ch.newIndex }))

    const action = (await request.formData()).get('action')
    const myChapter = chapters.find(ch => ch.path === chapterPath)
    const tresholdTest = action === 'prev-chapter' ? -1 : Number.MAX_SAFE_INTEGER
    const thresholdIndex = chapters.reduce(
      (pr, cu) =>
        (
          action === 'prev-chapter'
            ? cu.realindex > pr && cu.realindex < myChapter.realindex
            : cu.realindex < pr && cu.realindex > myChapter.realindex
        )
          ? cu.realindex
          : pr,
      tresholdTest
    )

    if (thresholdIndex === tresholdTest) {
      return redirect(`/manga/${series}`)
    } else {
      return redirect(`/manga/${series}/chapter/${chapters.filter(ch => ch.realindex === thresholdIndex)[0].path}`)
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
        <img key={index} src={imgSrc} alt='Manga chapter' />
      ))}
      <hr />
      <form method='POST'>
        <input type='hidden' name='action' value='prev-chapter' />
        <input type='submit' value='< Previous Chapter' />
      </form>
      <Link to={`/manga/${details.request.slug}`}>Back to {details.meta.name}</Link>
      <form method='POST'>
        <input type='hidden' name='action' value='next-chapter' />
        <input type='submit' value='> Next Chapter' />
      </form>
    </div>
  )
}
