import { Link, useLoaderData } from '@remix-run/react'
import { Fragment, useState } from 'react'
import { authorize } from '../onedrive.server'

import {
  getAllMangaSeries,
  getMangaSeriesByGenre,
  getMangaSeriesOnDeck,
  getNewlyUpdatedSeries
} from '../utils/manga.server'

export async function loader({ request }) {
  return authorize(request, async () => {
    return {
      all: await getAllMangaSeries(),
      byGenre: await getMangaSeriesByGenre(),
      onDeck: await getMangaSeriesOnDeck(),
      lastUpdated: await getNewlyUpdatedSeries()
    }
  })
}

function MangaViewCell({ manga }) {
  return (
    <td style={{ width: '200px' }}>
      <Link to={`manga/${manga.request.slug}/read`}>
        {manga.thumbnail !== undefined ? (
          <img
            src={`data:image/jpeg;base64, ${manga.thumbnail.toString('base64')}`}
            alt='Manga thumbnail'
            style={{ width: '180px', height: 'auto' }}
          />
        ) : (
          <img
            src={`/manga/image/${manga.request.slug}`}
            alt='Manga thumbnail'
            style={{ width: '180px', height: 'auto' }}
          />
        )}
      </Link>
      <br />
      <Link to={`manga/${manga.request.slug}`}>{manga.meta.name}</Link>
    </td>
  )
}

function MangaViewTable({ mangas, heading, showAllText = 'show all' }) {
  const [showAll, setShowAll] = useState(false)

  return mangas.length > 0 ? (
    <>
      {heading}
      <table style={{ borderCollapse: 'separate', borderSpacing: '8px' }}>
        <tbody>
          <tr>
            {mangas.slice(0, 7).map(manga => (
              <MangaViewCell key={manga._id.toString()} manga={manga} />
            ))}
          </tr>
          {mangas.length > 7 ? (
            showAll ? (
              [...Array(Math.ceil((mangas.length - 7) / 7)).keys()]
                .map(i => (i + 1) * 7)
                .map(startIndex => (
                  <tr key={startIndex}>
                    {mangas.slice(startIndex, startIndex + 7).map(manga => (
                      <MangaViewCell key={manga._id.toString()} manga={manga} />
                    ))}
                  </tr>
                ))
            ) : (
              <tr>
                <td rowspan={7}>
                  <button
                    onClick={() => {
                      setShowAll(true)
                    }}>
                    {showAllText}
                  </button>
                </td>
              </tr>
            )
          ) : null}
        </tbody>
      </table>
    </>
  ) : null
}

export default function Index() {
  const data = useLoaderData()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <table>
        <tbody>
          <tr>
            <td>
              <img src='/logo.png' alt='Manga Reader logo' />
            </td>
            <td>
              <h1>Manga Reader</h1>
            </td>
          </tr>
        </tbody>
      </table>
      <MangaViewTable mangas={data.onDeck} heading={<h2>On Deck</h2>} />
      <MangaViewTable mangas={data.lastUpdated} heading={<h2>Last Updated Series</h2>} />
      <h2>List by Genre</h2>
      {Object.keys(data.byGenre)
        .sort()
        .map(genre => (
          <MangaViewTable key={genre} mangas={data.byGenre[genre]} heading={<h3>Discover {genre}</h3>} />
        ))}
      <MangaViewTable mangas={data.all} heading={<h2>All Series</h2>} />
    </div>
  )
}
