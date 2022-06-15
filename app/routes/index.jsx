import { Link, useLoaderData } from '@remix-run/react'
import { Fragment } from 'react'
import { authorize } from '../onedrive.server'

import { getAllMangaSeries, getMangaSeriesByGenre } from '../utils/manga.server'

export async function loader({ request }) {
  return authorize(request, async () => {
    return {
      all: await getAllMangaSeries(),
      byGenre: await getMangaSeriesByGenre()
    }
  })
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
