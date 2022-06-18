import { getImage, markChapterAsSeen } from '../../../utils/manga.server'
import { authorize } from '../../../onedrive.server'

export async function loader({ request, params: { manga, chapter, image } }) {
  return authorize(request, async ({ token }) => {
    await markChapterAsSeen(manga, chapter)
    return new Response(await getImage(token, manga, chapter, image))
  })
}
