import { redirect } from '@remix-run/node'
import { Link, useLoaderData, Form, useSubmit } from '@remix-run/react'
import { authorize } from '../../onedrive.server'
import { useEffect, useState } from 'react'

import {
  getMangaDetail,
  hideChapter,
  showAllChapters,
  moveChapter,
  markChapter,
  markAllChapters,
  rateSeries,
  getRelatedMangasByGenre,
  getRelatedMangasByAuthor
} from '../../utils/manga.server'
import { MangaViewTable } from '../../components/mangaView'

export async function action({ request, params: { series } }) {
  return authorize(request, async () => {
    const formData = await request.formData(),
      action = formData.get('action')

    if (action === 'mark-all') {
      await markAllChapters(series, formData.get('mark-as') === 'read')
      return redirect(`/manga/${series}`)
    } else if (action === 'show-all') {
      await showAllChapters(series)
      return redirect(`/manga/${series}`)
    } else if (action === 'rate') {
      await rateSeries(formData.get('mangaId'), Number.parseInt(formData.get('rating-10'), 10))
      return redirect(`/manga/${series}`)
    }

    const chapters = (await getMangaDetail(series)).chapters

    for (let chapter of chapters) {
      if (formData.has(`action-move-down-${chapter._id.toString()}`)) {
        await moveChapter(series, chapter._id.toString(), false)
        return redirect(`/manga/${series}`)
      } else if (formData.has(`action-move-up-${chapter._id.toString()}`)) {
        await moveChapter(series, chapter._id.toString(), true)
        return redirect(`/manga/${series}`)
      }
    }

    for (let chapterId of formData.getAll('chapter-check')) {
      if (formData.has('action-hide')) {
        await hideChapter(chapterId)
      } else if (formData.has('action-mark-read')) {
        await markChapter(chapterId, true)
      } else if (formData.has('action-mark-unread')) {
        await markChapter(chapterId, false)
      }
    }

    return redirect(`/manga/${series}`)
  })
}

export async function loader({ request, params: { series } }) {
  return authorize(request, async () => {
    return {
      ...(await getMangaDetail(series)),
      byGenres: await getRelatedMangasByGenre(series),
      byAuthor: await getRelatedMangasByAuthor(series)
    }
  })
}

export default function MangaSeries() {
  const { details, chapters: rawChapters, byGenres, byAuthor } = useLoaderData()

  let chapters = rawChapters.map(ch => ({ ...ch, realIndex: ch.newIndex === null ? ch.index : ch.newIndex }))
  chapters.sort((chA, chB) => chA.realIndex - chB.realIndex)

  return (
    <>
      <Header details={details} chapters={chapters} />
      <section id='Subscribes' className='text-center py-20 dark:bg-slate-600'>
        <div className='container text-left'>
          <h4 className='mb-10 section-heading wow fadeInUp' data-wow-delay='0.3s'>
            Chapters
          </h4>
          <ChaptersView chapters={chapters} />
        </div>
      </section>
      <div>
        <MangaViewTable
          id={`author`}
          mangas={byAuthor}
          heading={`Read More by ${details.meta.author}`}
          useBlue={true}
          maxRows={2}
        />
        {Object.keys(byGenres).map((genre, i) => (
          <MangaViewTable
            id={`genre-${i}`}
            key={genre}
            mangas={byGenres[genre]}
            heading={`Read More in ${genre}`}
            lowerLevel={true}
            useBlue={i % 2 === (byAuthor.length > 0 ? 1 : 0)}
            maxRows={1}
          />
        ))}
      </div>
    </>
  )
}

function Header({ details, chapters }) {
  const rating = details.rating ?? 0
  const allUnread = chapters.filter(ch => !ch.hidden && !ch.read).length === 0
  const submit = useSubmit()

  return (
    <div id='feature' className='bg-blue-100 dark:bg-slate-800 pt-24 pb-5'>
      <div className='container'>
        <h2 className='mb-12 section-heading wow fadeInDown' data-wow-delay='0.3s'>
          {details.meta.name}
        </h2>
        <div className='flex flex-wrap items-center'>
          <div className='w-full lg:w-1/4'>
            <div className='mx-3 lg:mr-0 lg:ml-3 wow fadeInRight' data-wow-delay='0.3s'>
              <Link to={`read`}>
                <img src={`image/${details.request.slug}`} alt='Manga Thumbnail' />
              </Link>
            </div>
          </div>
          <div className='w-full lg:w-3/4'>
            <div className='mb-5 lg:mb-0'>
              <div className='flex flex-wrap'>
                <div>
                  {allUnread ? (
                    <Form
                      method='POST'
                      className='rating rating-lg rating-half mb-6'
                      onChange={e => {
                        submit(e.currentTarget, { replace: true })
                      }}>
                      <input type='hidden' name='action' value='rate' />
                      <input type='hidden' name='mangaId' value={details._id.toString()} />
                      <input
                        type='radio'
                        name='rating-10'
                        value={0}
                        className='rating-hidden'
                        defaultChecked={rating === 0}
                      />
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                        <input
                          key={i}
                          type='radio'
                          name='rating-10'
                          value={i}
                          defaultChecked={rating === i}
                          className={`bg-green-500 mask mask-star-2 mask-half-${i % 2 === 1 ? 1 : 2}`}
                        />
                      ))}
                    </Form>
                  ) : null}
                  <div className='flex flex-wrap items-center'>
                    <p className='pl-3 dark:text-gray-100'>
                      <strong>Status: </strong>
                      {details.meta.status}
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center'>
                    <p className='pl-3 dark:text-gray-100'>
                      <strong>Author: </strong>
                      {details.meta.author}
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center'>
                    <p className='pl-3 dark:text-gray-100'>
                      <strong>Genres: </strong>
                      {details.meta.genres.join(', ')}
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center'>
                    <p className='pl-3 dark:text-gray-100'>
                      <strong>Alternative title: </strong>
                      {details.meta.alternativeTitle}
                    </p>
                  </div>
                  <div className='flex flex-wrap items-center'>
                    <p className='pl-3 dark:text-gray-100'>
                      <strong>Source: </strong>
                      <a href={details.request.url} target='_blank' rel='noreferrer'>
                        see on mangago.me ⧉
                      </a>
                    </p>
                  </div>
                  {details.meta.additionalData?.application ? (
                    <div className='flex flex-wrap items-center'>
                      <p className='pl-3 dark:text-gray-100'>
                        <strong>Alternative source: </strong>
                        read on {details.meta.additionalData.application} mobile app
                      </p>
                    </div>
                  ) : null}
                  <div className='flex flex-wrap mt-6 items-center'>
                    <p className='pl-3 dark:text-gray-100'>{details.meta.summary}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChaptersView({ chapters }) {
  const [showEditTools, toggleEditTools] = useState(true)

  useEffect(() => {
    toggleEditTools(false)
  }, [])

  return (
    <div className='relative overflow-x-auto shadow-md sm:rounded-lg'>
      <Form method='POST'>
        {showEditTools ? (
          <div className='flex flex-wrap items-center'>
            <div className='p-4'>
              <label for='table-search' className='sr-only'>
                Search
              </label>
              <div className='relative mt-1'>
                <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
                  <svg
                    className='w-5 h-5 text-gray-500 dark:text-gray-400'
                    fill='currentColor'
                    viewBox='0 0 20 20'
                    xmlns='http://www.w3.org/2000/svg'>
                    <path
                      fill-rule='evenodd'
                      d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                      clip-rule='evenodd'></path>
                  </svg>
                </div>
                <input
                  type='text'
                  id='table-search'
                  className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-80 pl-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  placeholder='Search for items'
                />
              </div>
            </div>
            <div className='p-4'>
              <input type='submit' className='small-gray-btn' name='action-hide' value='Hide' />
            </div>
            <div className='p-4'>
              <input type='submit' className='small-gray-btn' name='action-mark-read' value='Mark Read' />
            </div>
            <div className='p-4'>
              <input type='submit' className='small-gray-btn' name='action-mark-unread' value='Mark Unread' />
            </div>
          </div>
        ) : null}
        <table className='w-full text-sm text-left text-gray-500 dark:text-gray-400'>
          <thead />
          <tbody>
            {chapters
              .filter(ch => !ch.hidden)
              .map((ch, chi) => ({ ...ch, displayIndex: chi }))
              .map(chapter => (
                <tr
                  key={chapter._id.toString()}
                  className='bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'>
                  {showEditTools ? (
                    <td className='w-4 p-4'>
                      <div className='flex items-center'>
                        <input
                          id='checkbox-table-search-1'
                          type='checkbox'
                          name='chapter-check'
                          value={chapter._id.toString()}
                          className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600'
                        />
                        <label for='checkbox-table-search-1' className='sr-only'>
                          checkbox
                        </label>
                      </div>
                    </td>
                  ) : null}
                  {showEditTools &&
                    (chapter.displayIndex > 0 ? (
                      <td className='w-4 p-4'>
                        <input
                          type='submit'
                          name={`action-move-up-${chapter._id.toString()}`}
                          value={'⬆️'}
                          className='small-gray-btn'
                        />
                      </td>
                    ) : (
                      <td>&nbsp;</td>
                    ))}
                  {showEditTools &&
                    (chapter.displayIndex < chapters.filter(ch => !ch.hidden).length - 1 ? (
                      <td className='w-4 p-4'>
                        <input
                          type='submit'
                          name={`action-move-down-${chapter._id.toString()}`}
                          value={'⬇️'}
                          className='small-gray-btn'
                        />
                      </td>
                    ) : (
                      <td>&nbsp;</td>
                    ))}
                  {chapter.read ? (
                    <th
                      scope='row'
                      className='px-6 py-4 font-medium italic text-gray-500 dark:text-white whitespace-nowrap'>
                      <Link to={`chapter/${chapter.chapterPath}`}>{chapter.name}</Link>
                    </th>
                  ) : (
                    <th scope='row' className='px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap'>
                      <Link to={`chapter/${chapter.chapterPath}`}>{chapter.name}</Link>
                    </th>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </Form>
      <div className='flex flex-wrap items-center'>
        <div className='p-4'>
          <input
            type='button'
            className='small-gray-btn'
            value={showEditTools ? 'Hide Edit Tools' : 'Show Edit Tools'}
            onClick={() => {
              toggleEditTools(!showEditTools)
            }}
          />
        </div>
        {showEditTools && chapters.filter(ch => ch.read !== false).length > 0 ? (
          <div className='p-4'>
            <Form method='POST' style={{ display: 'inline' }}>
              <input type='hidden' name='action' value='mark-all' />
              <input type='hidden' name='mark-as' value='unread' />
              <input type='submit' className='small-gray-btn' value={'Mark all as unread'} />
            </Form>
          </div>
        ) : null}
        {showEditTools && chapters.filter(ch => ch.read !== false).length === 0 ? (
          <div className='p-4'>
            <Form method='POST' style={{ display: 'inline' }}>
              <input type='hidden' name='action' value='mark-all' />
              <input type='hidden' name='mark-as' value='read' />
              <input type='submit' className='small-gray-btn' value={'Mark all as read'} />
            </Form>
          </div>
        ) : null}
        {showEditTools && chapters.filter(ch => ch.hidden).length > 0 ? (
          <div className='p-4'>
            <Form method='POST' style={{ display: 'inline' }}>
              <input type='hidden' name='action' value='show-all' />
              <input type='hidden' name='mark-as' value='read' />
              <input type='submit' className='small-gray-btn' value={'Show all hidden chapters'} />
            </Form>
          </div>
        ) : null}
      </div>
    </div>
  )
}
