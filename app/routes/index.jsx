import { Link, useLoaderData } from '@remix-run/react'
import { Fragment, useState } from 'react'
import { authorize } from '../onedrive.server'

import { getAllMangaSeries, getMangaSeriesByGenre, getMangaSeriesOnDeck } from '../utils/manga.server'

export async function loader({ request }) {
  return authorize(request, async () => {
    return {
      all: await getAllMangaSeries(),
      byGenre: await getMangaSeriesByGenre(),
      onDeck: await getMangaSeriesOnDeck()
    }
  })
}

function OnDeckCell({ manga }) {
  return (
    <td>
      <Link to={`manga/${manga.request.slug}/read`}>
        <img
          src={`/manga/image/${manga.request.slug}`}
          alt='Manga thumbnail'
          style={{ width: '180px', height: 'auto' }}
        />
      </Link>
      <br />
      <Link to={`manga/${manga.request.slug}`}>{manga.meta.name}</Link>
    </td>
  )
}

export default function Index() {
  const data = useLoaderData()
  const [showAllOnDeck, setShowAllOnDeck] = useState(false)

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
      {data.onDeck.length > 0 ? (
        <>
          <h2>On Deck</h2>
          <table style={{ borderCollapse: 'separate', borderSpacing: '8px' }}>
            <tbody>
              <tr>
                {data.onDeck.slice(0, 7).map(manga => (
                  <OnDeckCell key={manga._id.toString()} manga={manga} />
                ))}
              </tr>
              {data.onDeck.length > 7 ? (
                showAllOnDeck ? (
                  <tr>
                    <td rowspan={7}>
                      <button
                        onClick={() => {
                          setShowAllOnDeck(true)
                        }}>
                        show all
                      </button>
                    </td>
                  </tr>
                ) : (
                  [...Array(Math.ceil((data.onDeck.length - 7) / 7)).keys()]
                    .map(i => (i + 1) * 7)
                    .map(startIndex => (
                      <tr key={startIndex}>
                        {data.onDeck.slice(startIndex, startIndex + 7).map(manga => (
                          <OnDeckCell key={manga._id.toString()} manga={manga} />
                        ))}
                      </tr>
                    ))
                )
              ) : null}
            </tbody>
          </table>
        </>
      ) : null}
      <h2>All Series List</h2>
      <ul>
        {data.all.map(manga => (
          <li key={manga._id.toString()}>
            <Link to={`manga/${manga.request.slug}`}>{manga.meta.name}</Link>
          </li>
        ))}
      </ul>
      <h2>List by Genre</h2>
      {Object.keys(data.byGenre)
        .sort()
        .map(genre => (
          <Fragment key={genre}>
            <h3>{genre}</h3>
            <ul>
              {data.byGenre[genre]
                .slice()
                .sort((a, b) => a.meta.name.localeCompare(b.meta.name))
                .map(series => (
                  <li key={series.request.slug}>
                    <Link to={`manga/${series.request.slug}`}>{series.meta.name}</Link>
                  </li>
                ))}
            </ul>
          </Fragment>
        ))}
    </div>
  )
}
