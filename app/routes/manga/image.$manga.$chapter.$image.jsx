import { getImage } from '../../utils/manga.server'
import { authorize } from '../../onedrive.server'

export async function loader({ request, params: { manga, chapter, image } }) {
  return authorize(request, async ({ token }) => {
    return new Response(await getImage(token, manga, chapter, image))
  })
}
