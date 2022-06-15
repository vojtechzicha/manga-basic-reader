import { redirect } from '@remix-run/node'
import { getNextUnreadChapter } from '../../utils/manga.server'

export async function loader({ params: { series } }) {
  return redirect(`/manga/${series}/chapter/${await getNextUnreadChapter(series)}`)
}
