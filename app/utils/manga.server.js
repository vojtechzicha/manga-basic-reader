import { chaptersCollection, mangasCollection } from '../db.server'
import { ObjectId } from 'mongodb'
const rootPath = 'https://graph.microsoft.com/v1.0/me/drive/root:/DMS/MangaGoArchive'

async function fetchOnedrive(path, token) {
  const response = await fetch(`${rootPath}/${path}`, {
    method: 'GET',
    headers: new Headers([['Authorization', `Bearer ${token}`]])
  }).then(r => r.json())

  if (response.error !== undefined) {
    throw response.error
  }
  return response
}

export async function getAllMangaSeries() {
  const data = await mangasCollection
    .find(
      {},
      {
        sort: { 'meta.name': 1 },
        projection: { 'meta.name': 1, 'request.slug': 1 }
      }
    )
    .toArray()
  return data
}
export async function getMangaSeriesByGenre() {
  return (
    await mangasCollection.find({}, { projection: { 'request.slug': 1, 'meta.name': 1, 'meta.genres': 1 } }).toArray()
  )
    .reduce((pr, manga) => [...pr, ...manga.meta.genres.map(genre => [genre, manga])], [])
    .reduce((pr, cu) => ({ ...pr, [cu[0]]: [...(pr[cu[0]] === undefined ? [] : pr[cu[0]]), cu[1]] }), {})
}

export async function getMangaDetail(mangaPath) {
  const details = await mangasCollection.findOne({ 'request.slug': mangaPath })
  const chapters = await chaptersCollection.find({ mangaPath }).toArray()

  return { details, chapters }
}

export async function getImages(token, seriesId, chapterId) {
  const childItems = await fetchOnedrive(`${seriesId}/${chapterId}:/children`, token)

  const images = childItems.value.map(imageItem => imageItem.name).filter(file => /^Img-([0-9]+)/.exec(file) !== null)
  images.sort(
    (fA, fB) => Number.parseInt(/^Img-([0-9]+)/.exec(fA)[1], 10) - Number.parseInt(/Img-([0-9]+)/.exec(fB)[1], 10)
  )
  return images
}

export function getImage(token, manga, chapter, image) {
  return fetch(`${rootPath}/${manga}/${chapter}/${image}:/content`, {
    method: 'GET',
    headers: new Headers([['Authorization', `Bearer ${token}`]])
  }).then(response => response.body)
}

export function getThumbnailImage(token, manga) {
  return fetch(`${rootPath}/${manga}/Thumbnail.jpg:/content`, {
    method: 'GET',
    headers: new Headers([['Authorization', `Bearer ${token}`]])
  }).then(response => response.body)
}

export async function hideChapter(chapterId) {
  await chaptersCollection.updateOne({ _id: ObjectId(chapterId) }, { $set: { hidden: true } })
}

export async function markChapter(chapterId, asRead, readDate = null) {
  await chaptersCollection.updateOne(
    { _id: ObjectId(chapterId) },
    { $set: { read: asRead, readAt: asRead ? readDate ?? new Date() : null } }
  )
}

export async function showAllChapters(mangaPath) {
  await chaptersCollection.updateMany({ mangaPath }, { $set: { hidden: false, newIndex: null } })
}

export async function markAllChapters(mangaPath, asRead, readDate = null) {
  await chaptersCollection.updateMany(
    { mangaPath },
    { $set: { read: asRead, readAt: asRead ? readDate ?? new Date() : null } }
  )
}

export async function moveChapter(mangaPath, chapterId, shouldMoveUp) {
  const allChapters = await chaptersCollection.find({ mangaPath }).toArray(),
    chapters = allChapters
      .filter(ch => !ch.hidden)
      .map(ch => ({ ...ch, realIndex: ch.newIndex === null ? ch.index : ch.newIndex })),
    currentChapterIndex = chapters.find(ch => ch._id.toString() === chapterId).realIndex,
    newChapterIndex = shouldMoveUp
      ? chapters.reduce((pr, cu) => (cu.realIndex > pr && cu.realIndex < currentChapterIndex ? cu.realIndex : pr), -1)
      : chapters.reduce(
          (pr, cu) => (cu.realIndex < pr && cu.realIndex > currentChapterIndex ? cu.realIndex : pr),
          Number.MAX_SAFE_INTEGER
        ),
    newChapterPath = chapters.find(ch => ch.realIndex === newChapterIndex).chapterPath

  if (newChapterIndex !== -1 && newChapterIndex !== Number.MAX_SAFE_INTEGER) {
    await chaptersCollection.updateOne({ _id: ObjectId(chapterId) }, { $set: { newIndex: newChapterIndex } })
    await chaptersCollection.updateOne(
      { mangaPath, chapterPath: newChapterPath },
      { $set: { newIndex: currentChapterIndex } }
    )
  }
}

export async function getNextUnreadChapter(mangaPath) {
  const allChapters = await chaptersCollection.find({ mangaPath }).toArray(),
    chapters = allChapters.filter(ch => !ch.hidden).map(ch => ({ ...ch, realIndex: ch.newIndex ?? ch.index }))

  if (chapters.length === 0) return allChapters[0].chapterPath

  const lastReadChapterIndex = chapters
    .filter(ch => ch.read)
    .reduce((pr, cu) => (cu.realIndex > pr ? cu.realIndex : pr), -1)
  const thresholdIndex = chapters.reduce(
    (pr, cu) => (cu.realIndex < pr && cu.realIndex > lastReadChapterIndex ? cu.realIndex : pr),
    Number.MAX_SAFE_INTEGER
  )

  if (thresholdIndex === Number.MAX_SAFE_INTEGER) {
    chapters.sort((a, b) => a.realIndex - b.realIndex)
    return chapters[0].chapterPath
  } else {
    return chapters.find(ch => ch.realIndex === thresholdIndex).chapterPath
  }
}

export async function getNextChapter(mangaPath, chapterPath) {
  const allChapters = await chaptersCollection.find({ mangaPath }).toArray(),
    chapters = allChapters.filter(ch => !ch.hidden).map(ch => ({ ...ch, realIndex: ch.newIndex ?? ch.index }))

  if (chapters.length === 0) return null

  const currentChapterIndex = chapters.find(ch => ch.chapterPath === chapterPath)?.realIndex
  if (currentChapterIndex === null || currentChapterIndex === undefined) return null

  const thresholdIndex = chapters.reduce(
    (pr, cu) => (cu.realIndex < pr && cu.realIndex > currentChapterIndex ? cu.realIndex : pr),
    Number.MAX_SAFE_INTEGER
  )

  if (thresholdIndex === Number.MAX_SAFE_INTEGER) {
    return null
  } else {
    return chapters.find(ch => ch.realIndex === thresholdIndex)
  }
}

export async function getPreviousChapter(mangaPath, chapterPath) {
  const allChapters = await chaptersCollection.find({ mangaPath }).toArray(),
    chapters = allChapters.filter(ch => !ch.hidden).map(ch => ({ ...ch, realIndex: ch.newIndex ?? ch.index }))

  if (chapters.length === 0) return null

  const currentChapterIndex = chapters.find(ch => ch.chapterPath === chapterPath)?.realIndex
  if (currentChapterIndex === null || currentChapterIndex === undefined) return null

  const thresholdIndex = chapters.reduce(
    (pr, cu) => (cu.realIndex > pr && cu.realIndex < currentChapterIndex ? cu.realIndex : pr),
    -1
  )

  if (thresholdIndex === -1) {
    return null
  } else {
    return chapters.find(ch => ch.realIndex === thresholdIndex)
  }
}
