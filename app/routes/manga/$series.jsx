import { redirect } from '@remix-run/node'
import { Link, useLoaderData, Form } from '@remix-run/react'
import { authorize } from '../../onedrive.server'
import { useState } from 'react'

import { getMangaDetail, hideChapter, showAllChapter, moveChapter } from '../../utils/manga.server'

export async function action({ request, params: { series } }) {
  return authorize(request, async ({ token }) => {
    const formData = await request.formData(),
      chapterPath = formData.get('chapter.path'),
      action = formData.get('action')

    if (action === 'hide') {
      await hideChapter(token, series, chapterPath)
      return redirect(`/manga/${series}`)
    } else if (action === 'show-all') {
      await showAllChapter(token, series)
      return redirect(`/manga/${series}`)
    } else {
      await moveChapter(token, series, chapterPath, action === 'move-up')
      return redirect(`/manga/${series}`)
    }
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
      <p>{data.meta.summary}</p>
      <p>
        <Link to='/'>Back to Manga Listing</Link>
      </p>
      <hr />
      <h2>Chapters</h2>
      <table>
        <tbody>
          {chapters
            .filter(ch => !ch.hidden)
            .map((ch, chi) => ({ ...ch, displayIndex: chi }))
            .map(chapter => (
              <tr key={chapter.path}>
                <td>
                  {chapter.read ? (
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
