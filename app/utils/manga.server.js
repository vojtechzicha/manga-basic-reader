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
  return await mangasCollection
    .find(
      {},
      {
        sort: { 'meta.name': 1 },
        projection: { 'meta.name': 1, 'request.slug': 1, thumbnail: 1 }
      }
    )
    .toArray()
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

export async function getMangaSeriesByGenre() {
  const readMangalist = (
    await chaptersCollection
      .aggregate([
        { $match: { read: true, hidden: false } },
        {
          $group: {
            _id: { mangaPath: '$mangaPath' }
          }
        }
      ])
      .toArray()
  ).map(gr => gr._id.mangaPath)

  let genres = (
    await mangasCollection
      .find(
        { 'request.slug': { $nin: readMangalist } },
        { projection: { 'request.slug': 1, 'meta.name': 1, 'meta.genres': 1 } }
      )
      .toArray()
  )
    .reduce((pr, manga) => [...pr, ...manga.meta.genres.map(genre => [genre, manga])], [])
    .reduce((pr, cu) => ({ ...pr, [cu[0]]: [...(pr[cu[0]] === undefined ? [] : pr[cu[0]]), cu[1]] }), {})

  let ret = {},
    genreKeys = Object.keys(genres),
    i = 0
  shuffleArray(genreKeys)

  for (let genre of genreKeys) {
    ret[genre] = genres[genre]
    shuffleArray(ret[genre])

    i += 1
    if (i > 7) break
  }
  return ret
}

export async function getRelatedMangasByGenre(mangaPath) {
  const genres = (
    await mangasCollection.findOne({ 'request.slug': mangaPath }, { projection: { 'meta.genres': 1, _id: 0 } })
  ).meta.genres

  let ret = {},
    i = 0
  shuffleArray(genres)

  for (let genre of genres) {
    ret[genre] = await mangasCollection
      .find(
        { 'meta.genres': genre, 'request.slug': { $ne: mangaPath } },
        { projection: { 'request.slug': 1, 'meta.name': 1, thumbnail: 1 } }
      )
      .toArray()
    shuffleArray(ret[genre])

    i += 1
    if (i > 7) break
  }
  return ret
}

export async function getRelatedMangasByAuthor(mangaPath) {
  const author = (
    await mangasCollection.findOne({ 'request.slug': mangaPath }, { projection: { 'meta.author': 1, _id: 0 } })
  ).meta.author

  let ret = await mangasCollection
    .find(
      { 'meta.author': author, 'request.slug': { $ne: mangaPath } },
      { projection: { 'request.slug': 1, 'meta.name': 1, thumbnail: 1 } }
    )
    .toArray()
  shuffleArray(ret)
  return ret
}

export async function getMangaSeriesOnDeck() {
  const mangaList = await chaptersCollection
    .aggregate([
      { $match: { hidden: false } },
      {
        $group: {
          _id: { mangaPath: '$mangaPath', read: '$read' },
          count: { $count: {} },
          newestRead: { $max: '$readAt' }
        }
      }
    ])
    .toArray()
  let filteredList = mangaList
    .map(group => {
      if (group._id.read) return null
      const readPart = mangaList.find(gr => gr._id.mangaPath === group._id.mangaPath && gr._id.read)
      if (readPart === undefined) return null
      return {
        mangaPath: group._id.mangaPath,
        date: readPart.newestRead
      }
    })
    .filter(group => group !== null)
  filteredList.sort((a, b) => b.date - a.date)

  const mangasList = await mangasCollection
    .find(
      { 'request.slug': { $in: filteredList.map(i => i.mangaPath) } },
      {
        sort: { 'meta.name': 1 },
        projection: { 'meta.name': 1, 'request.slug': 1, thumbnail: 1 }
      }
    )
    .toArray()

  return filteredList.map(fli => ({
    ...mangasList.find(mli => mli.request.slug === fli.mangaPath),
    newestRead: new Date(fli.date)
  }))
}

export async function getNewlyUpdatedSeries() {
  let date30DaysBefore = new Date()
  date30DaysBefore.setDate(date30DaysBefore.getDate() - 30)

  const mangaList = await chaptersCollection
    .aggregate([
      { $match: { hidden: false } },
      {
        $group: {
          _id: { mangaPath: '$mangaPath' },
          newestUpdate: { $max: '$lastUpdated' }
        }
      },
      { $match: { newestUpdate: { $gt: date30DaysBefore } } },
      { $sort: { newestUpdate: -1 } }
      // { $limit: 10 }
    ])
    .toArray()
  const filteredList = await mangasCollection
    .find(
      { 'request.slug': { $in: mangaList.map(i => i._id.mangaPath) } },
      {
        sort: { 'meta.name': 1 },
        projection: { 'meta.name': 1, 'request.slug': 1, thumbnail: 1 }
      }
    )
    .toArray()

  let joinedList = filteredList.map(ma => ({
    ...ma,
    updatedAt: mangaList.find(m => m._id.mangaPath === ma.request.slug)?.newestUpdate
  }))
  joinedList.sort((a, b) => b.updatedAt - a.updatedAt)
  return joinedList
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

export async function getThumbnailImage(mangaPath) {
  const manga = await mangasCollection.findOne({ 'request.slug': mangaPath }, { projection: { thumbnail: 1, _id: 0 } })
  return manga.thumbnail.buffer
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
  console.log({ mangaPath })
  const allChapters = await chaptersCollection.find({ mangaPath }, { skipSessions: true }).toArray(),
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
