import { Link, useLoaderData } from '@remix-run/react'
import { Fragment, useState, useEffect } from 'react'
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
    <div className='max-w-sm sm:w-1/2 md:w-1/4 lg:w-1/6'>
      <div className='team-item'>
        <div className='team-img relative'>
          <Link to={`manga/${manga.request.slug}/read`}>
            {manga.thumbnail !== undefined ? (
              <img
                className='img-fluid'
                src={`data:image/jpeg;base64, ${manga.thumbnail.toString('base64')}`}
                alt='Manga thumbnail'
                style={{ width: '370px', height: '320px', objectFit: 'cover' }}
              />
            ) : (
              <img
                className='img-fluid'
                src={`/manga/image/${manga.request.slug}`}
                alt='Manga thumbnail'
                style={{ width: '370px', height: '320px', objectFit: 'cover' }}
              />
            )}
          </Link>
        </div>
        <div className='text-center px-5 py-3'>
          <h3 className='team-name'>
            <Link to={`manga/${manga.request.slug}`}>{manga.meta.name}</Link>
          </h3>
        </div>
      </div>
    </div>
  )
}

function MangaViewTable({
  id,
  mangas,
  heading,
  showAllText = 'Show All',
  useBlue = false,
  lowerLevel = false,
  maxRows = 2
}) {
  const [showAll, setShowAll] = useState(true)

  useEffect(() => {
    const grid = Array.from(document.querySelector(`#${id}`)?.children)
    const breakIndex = grid.findIndex(item => item.offsetTop > grid[0].offsetTop)
    const numPerRow = breakIndex === -1 ? grid.length : breakIndex

    if (mangas.length > numPerRow * maxRows) {
      setShowAll(numPerRow * maxRows)
    }
  }, [id, mangas.length, maxRows])

  return mangas.length > 0 ? (
    <section id='team' className={`py-24 text-center ${useBlue ? 'bg-blue-100' : ''}`}>
      <div className='container'>
        <div className='text-center'>
          {lowerLevel ? (
            <h3 className='mb-10 section-heading-lower wow fadeInDown' data-wow-delay='0.3s' id={`heading-${id}`}>
              {heading}
            </h3>
          ) : (
            <h2 className='mb-12 section-heading wow fadeInDown' data-wow-delay='0.3s' id={`heading-${id}`}>
              {heading}
            </h2>
          )}
        </div>
        <div className='flex flex-wrap justify-center' id={id}>
          {mangas.slice(0, showAll === true ? mangas.length : showAll).map(manga => (
            <MangaViewCell key={manga._id.toString()} manga={manga} />
          ))}
          {showAll !== true ? (
            <div className='submit-button mx-3'>
              <button
                className='btn'
                onClick={() => {
                  setShowAll(true)
                }}>
                show {mangas.length - showAll} more
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  ) : null
}

export default function Index() {
  const data = useLoaderData()

  return (
    <>
      <MangaViewTable id='on-deck' mangas={data.onDeck} heading='On Deck' useBlue={true} maxRows={2} />
      <MangaViewTable id='last-updated' mangas={data.lastUpdated} heading='Last Updated Series' maxRows={1} />
      {Object.keys(data.byGenre)
        .sort()
        .filter(genre => data.byGenre[genre].length > 1)
        .map((genre, i) => (
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
      <MangaViewTable id='all' mangas={data.all} heading='All Series' maxRows={2} />
    </>
  )
}
