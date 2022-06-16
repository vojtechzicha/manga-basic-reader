import { useLoaderData } from '@remix-run/react'
import { authorize } from '../onedrive.server'

import {
  getAllMangaSeries,
  getMangaSeriesByGenre,
  getMangaSeriesOnDeck,
  getNewlyUpdatedSeries
} from '../utils/manga.server'
import { MangaViewTable, MangaTable } from '../components/mangaView'

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

function isWithin30Days(date) {
  const testDate = new Date()
  testDate.setDate(testDate.getDate() - 30)

  const diff = Math.abs(new Date(date).getTime() - testDate.getTime())
  return diff / (1000 * 60 * 60 * 24)
}

export default function Index() {
  const data = useLoaderData()
  console.log(data.onDeck.filter(series => !isWithin30Days(series.newestRead)))

  return (
    <>
      <MangaViewTable
        id='on-deck'
        mangas={data.onDeck.filter(series => isWithin30Days(series.newestRead))}
        heading='On Deck'
        useBlue={true}
        maxRows={2}
      />
      <MangaViewTable id='last-updated' mangas={data.lastUpdated} heading='Last Updated Series' maxRows={1} />
      {Object.keys(data.byGenre).map((genre, i) => (
        <MangaViewTable
          id={`genre-${i}`}
          key={genre}
          mangas={data.byGenre[genre]}
          heading={`Discover ${genre}`}
          lowerLevel={true}
          useBlue={i % 2 === 0}
          maxRows={1}
        />
      ))}
      <MangaViewTable
        id='continue-reading'
        mangas={data.onDeck.filter(series => !isWithin30Days(series.newestRead))}
        heading='Continue Reading'
        useBlue={true}
        maxRows={1}
      />
      <MangaTable id='all' mangas={data.all} heading='All Series' />
    </>
  )
}
