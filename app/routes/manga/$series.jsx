import { redirect } from '@remix-run/node'
import { Link, useLoaderData, Form } from '@remix-run/react'
import { authorize } from '../../onedrive.server'
import { useState } from 'react'

import {
  getMangaDetail,
  hideChapter,
  showAllChapters,
  moveChapter,
  markChapter,
  markAllChapters,
  getNextUnreadChapter
} from '../../utils/manga.server'

export async function action({ request, params: { series } }) {
  return authorize(request, async () => {
    const formData = await request.formData(),
      chapterId = formData.get('_id'),
      action = formData.get('action')

    if (action === 'start-reading') {
      return redirect(`/manga/${series}/chapter/${await getNextUnreadChapter(series)}`)
    }

    if (action === 'hide') {
      await hideChapter(chapterId)
    } else if (action === 'show-all') {
      await showAllChapters(series)
    } else if (action.startsWith('move')) {
      await moveChapter(series, chapterId, action === 'move-up')
    } else if (action === 'mark') {
      await markChapter(chapterId, formData.get('mark-as') === 'read')
    } else if (action === 'mark-all') {
      await markAllChapters(series, formData.get('mark-as') === 'read')
    }

    return redirect(`/manga/${series}`)
  })
}

export async function loader({ request, params: { series } }) {
  return authorize(request, async () => {
    return await getMangaDetail(series)
  })
}

export default function MangaSeries() {
  const { details, chapters: rawChapters } = useLoaderData()
  const [showEditTools, toggleEditTools] = useState(false)
  console.log(rawChapters)

  let chapters = rawChapters.map(ch => ({ ...ch, realIndex: ch.newIndex === null ? ch.index : ch.newIndex }))
  chapters.sort((chA, chB) => chA.realIndex - chB.realIndex)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>{details.meta.name}</h1>
      <table>
        <tbody>
          <tr>
            <td>
              <img src={`/manga/image/${details.request.slug}`} alt='Manga thumbnail' />
            </td>
            <td>
              <ul>
                <li>
                  <strong>Status: </strong>
                  {details.meta.status}
                </li>
                <li>
                  <strong>Author: </strong>
                  {details.meta.author}
                </li>
                <li>
                  <strong>Genres: </strong>
                  {details.meta.genres.join(', ')}
                </li>
                <li>
                  <strong>Alternative title: </strong>
                  {details.meta.alternativeTitle}
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
      <p>{details.meta.summary}</p>
      <p>
        <Link to='/'>Back to Manga Listing</Link>
      </p>
      <hr />
      <Form method='POST'>
        <input type='hidden' name='action' value='start-reading' />
        <input
          type='submit'
          value={
            chapters.filter(ch => ch.read !== false).length > 0 && chapters.filter(ch => ch.read === false).length > 0
              ? 'Continue reading'
              : 'Start reading'
          }
        />
      </Form>
      <h2>Chapters</h2>
      <table>
        <tbody>
          {chapters
            .filter(ch => !ch.hidden)
            .map((ch, chi) => ({ ...ch, displayIndex: chi }))
            .map(chapter => (
              <tr key={chapter._id.toString()}>
                <td>
                  {chapter.read !== false ? (
                    <em>
                      <Link to={`chapter/${chapter.chapterPath}`}>{chapter.name}</Link>
                    </em>
                  ) : (
                    <>
                      <Link to={`chapter/${chapter.chapterPath}`}>{chapter.name}</Link>
                    </>
                  )}
                </td>
                {showEditTools && (
                  <td>
                    <Form method='POST' style={{ display: 'inline' }}>
                      <input type='hidden' name='_id' value={chapter._id.toString()} />
                      <input type='hidden' name='action' value='hide' />
                      <input type='submit' value={'❌'} />
                    </Form>
                  </td>
                )}
                {showEditTools &&
                  (chapter.displayIndex > 0 ? (
                    <td>
                      <Form method='POST' style={{ display: 'inline' }}>
                        <input type='hidden' name='_id' value={chapter._id.toString()} />
                        <input type='hidden' name='action' value='move-up' />
                        <input type='submit' value={'⬆️'} />
                      </Form>
                    </td>
                  ) : (
                    <td>&nbsp;</td>
                  ))}
                {showEditTools &&
                  (chapter.displayIndex < chapters.filter(ch => !ch.hidden).length - 1 ? (
                    <td>
                      <Form method='POST' style={{ display: 'inline' }}>
                        <input type='hidden' name='_id' value={chapter._id.toString()} />
                        <input type='hidden' name='action' value='mode-down' />
                        <input type='submit' value={'⬇️'} />
                      </Form>
                    </td>
                  ) : (
                    <td>&nbsp;</td>
                  ))}
                {showEditTools ? (
                  <td>
                    <Form method='POST' style={{ display: 'inline' }}>
                      <input type='hidden' name='_id' value={chapter._id.toString()} />
                      <input type='hidden' name='action' value='mark' />
                      <input type='hidden' name='mark-as' value={chapter.read ? 'unread' : 'read'} />
                      <input type='submit' value={chapter.read ? '⭐' : '✔️'} />
                    </Form>
                  </td>
                ) : (
                  <td>&nbsp;</td>
                )}
              </tr>
            ))}
        </tbody>
        <tfoot>
          {showEditTools && chapters.filter(ch => ch.hidden).length > 0 ? (
            <tr>
              <td rowSpan={4}>
                <Form method='POST' style={{ display: 'inline' }}>
                  <input type='hidden' name='action' value='show-all' />
                  <input type='submit' value={'Show all hidden chapters'} />
                </Form>
              </td>
            </tr>
          ) : null}
          {showEditTools && chapters.filter(ch => ch.read !== false).length > 0 ? (
            <tr>
              <td rowSpan={4}>
                <Form method='POST' style={{ display: 'inline' }}>
                  <input type='hidden' name='action' value='mark-all' />
                  <input type='hidden' name='mark-as' value='unread' />
                  <input type='submit' value={'Mark all as unread'} />
                </Form>
              </td>
            </tr>
          ) : null}
          {showEditTools && chapters.filter(ch => ch.read !== false).length === 0 ? (
            <tr>
              <td rowSpan={4}>
                <Form method='POST' style={{ display: 'inline' }}>
                  <input type='hidden' name='action' value='mark-all' />
                  <input type='hidden' name='mark-as' value='read' />
                  <input type='submit' value={'Mark all as read'} />
                </Form>
              </td>
            </tr>
          ) : null}
        </tfoot>
      </table>
      <hr />
      <button
        onClick={() => {
          toggleEditTools(!showEditTools)
        }}>
        {showEditTools ? 'Hide ' : 'Show '}edit tools
      </button>
    </div>
  )
}
