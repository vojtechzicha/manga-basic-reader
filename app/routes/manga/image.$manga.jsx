import { getThumbnailImage } from '../../utils/manga.server'
import { authorize } from '../../onedrive.server'
import { json } from '@remix-run/node'

export async function loader({ request, params: { manga } }) {
  return authorize(request, async () => {
    return new Response(await getThumbnailImage(manga))
  })
}
