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
  return authorize(request, async ({ token }) => {
    const formData = await request.formData(),
      chapterPath = formData.get('chapter.path'),
      action = formData.get('action')

    if (action === 'start-reading') {
      return redirect(`/manga/${series}/chapter/${await getNextUnreadChapter(token, series)}`)
    }

    if (action === 'hide') {
      await hideChapter(token, series, chapterPath)
    } else if (action === 'show-all') {
      await showAllChapters(token, series)
    } else if (action.startsWith('move')) {
      await moveChapter(token, series, chapterPath, action === 'move-up')
    } else if (action === 'mark') {
      await markChapter(token, series, chapterPath, formData.get('mark-as') === 'read', new Date())
    } else if (action === 'mark-all') {
      await markAllChapters(token, series, formData.get('mark-as') === 'read', new Date())
    }

    return redirect(`/manga/${series}`)
  })
}

export async function loader({ request, params: { series } }) {
  return authorize(request, async ({ token }) => {
    const data = await getMangaDetail(token, series)
    return data
  })
}

export default function MangaSeries() {
  const data = useLoaderData()
  const [showEditTools, toggleEditTools] = useState(false)

  let chapters = data.chapters.map(ch => ({ ...ch, realIndex: ch.newIndex === null ? ch.index : ch.newIndex }))
  chapters.sort((chA, chB) => chA.realIndex - chB.realIndex)

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <h1>{data.meta.name}</h1>
      <table>
        <tbody>
          <tr>
            <td>
              <img src={`/manga/image/${data.request.slug}`} alt='Manga thumbnail' />
            </td>
            <td>
              <ul>
                <li>
                  <strong>Status: </strong>
                  {data.meta.status}
                </li>
                <li>
                  <strong>Author: </strong>
                  {data.meta.author}
                </li>
                <li>
                  <strong>Genres: </strong>
                  {data.meta.genres.join(', ')}
                </li>
                <li>
                  <strong>Alternative title: </strong>
                  {data.meta.alternativeTitle}
                </li>
              </ul>
            </td>
          </tr>
        </tbody>
      </table>
      <p>{data.meta.summary}</p>
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
              <tr key={chapter.path}>
                <td>
                  {chapter.read !== false ? (
                    <em>
                      <Link to={`chapter/${chapter.path}`}>{chapter.meta.name}</Link>
                    </em>
                  ) : (
                    <>
                      <Link to={`chapter/${chapter.path}`}>{chapter.meta.name}</Link>
                    </>
                  )}
                </td>
                {showEditTools && (
                  <td>
                    <Form method='POST' style={{ display: 'inline' }}>
                      <input type='hidden' name='chapter.path' value={chapter.path} />
                      <input type='hidden' name='action' value='hide' />
                      <input type='submit' value={'❌'} />
                    </Form>
                  </td>
                )}
                {showEditTools &&
                  (chapter.displayIndex > 0 ? (
                    <td>
                      <Form method='POST' style={{ display: 'inline' }}>
                        <input type='hidden' name='chapter.path' value={chapter.path} />
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
                        <input type='hidden' name='chapter.path' value={chapter.path} />
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
                      <input type='hidden' name='chapter.path' value={chapter.path} />
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
