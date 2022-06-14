import { Link, useLoaderData } from '@remix-run/react'
import { Fragment } from 'react'
import { authorize } from '../onedrive.server'

import { getMangaSeries, getMangaSeriesByGenre } from '../utils/manga.server'

export async function loader({ request }) {
  return authorize(request, async ({ token }) => {
    return {
      all: await getMangaSeries(token),
      byGenre: await getMangaSeriesByGenre(token)
    }
  })
}

export default function Index() {
  const data = useLoaderData()

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>Manga Reader</h1>
      <h2>All Series List</h2>
      <ul>
        {Object.keys(data.all)
          .sort()
          .map(seriesId => (
            <li key={seriesId}>
              <Link to={`manga/${seriesId}`}>{data.all[seriesId].meta.name}</Link>
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
