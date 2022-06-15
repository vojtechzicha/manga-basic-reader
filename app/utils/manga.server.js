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

export function getMangaSeries(token) {
  return fetchOnedrive('Description.json:/content', token)
}
export async function getMangaSeriesByGenre(token) {
  const mangas = await getMangaSeries(token)
  return Object.keys(mangas)
    .map(slug => ({ id: slug, ...mangas[slug] }))
    .reduce((pr, data) => [...pr, ...data.meta.genres.map(genre => [genre, data])], [])
    .reduce((pr, cu) => ({ ...pr, [cu[0]]: [...(pr[cu[0]] === undefined ? [] : pr[cu[0]]), cu[1]] }), {})
}

export function getMangaDetail(token, seriesId) {
  return fetchOnedrive(`${seriesId}/Description.json:/content`, token)
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

export async function hideChapter(token, manga, chapterPath) {
  const details = await getMangaDetail(token, manga)
  let newChapters = []
  details.chapters.forEach((chapter, chapterIndex) => {
    if (chapter.path === chapterPath) {
      newChapters[chapterIndex] = { ...chapter, hidden: true }
    } else {
      newChapters[chapterIndex] = chapter
    }
  })

  const response = await fetch(`${rootPath}/${manga}/Description.json:/content`, {
    method: 'PUT',
    headers: new Headers([
      ['Authorization', `Bearer ${token}`],
      ['Content-Type', 'application/json']
    ]),
    body: JSON.stringify({ ...details, chapters: newChapters })
  })
  console.log(await response.json())
}

export async function markChapter(token, manga, chapterPath, asRead, readDate = null) {
  const details = await getMangaDetail(token, manga)
  let newChapters = []
  details.chapters.forEach((chapter, chapterIndex) => {
    if (chapter.path === chapterPath) {
      newChapters[chapterIndex] = { ...chapter, read: asRead === true ? (readDate ?? new Date()).toISOString() : false }
    } else {
      newChapters[chapterIndex] = chapter
    }
  })

  const response = await fetch(`${rootPath}/${manga}/Description.json:/content`, {
    method: 'PUT',
    headers: new Headers([
      ['Authorization', `Bearer ${token}`],
      ['Content-Type', 'application/json']
    ]),
    body: JSON.stringify({ ...details, chapters: newChapters })
  })
  console.log(await response.json())
}

export async function showAllChapters(token, manga) {
  const details = await getMangaDetail(token, manga)

  const response = await fetch(`${rootPath}/${manga}/Description.json:/content`, {
    method: 'PUT',
    headers: new Headers([
      ['Authorization', `Bearer ${token}`],
      ['Content-Type', 'application/json']
    ]),
    body: JSON.stringify({
      ...details,
      chapters: details.chapters.map(ch => ({ ...ch, hidden: false, newIndex: null, realIndex: undefined }))
    })
  })
  console.log(await response.json())
}

export async function markAllChapters(token, manga, asRead, readDate = null) {
  const details = await getMangaDetail(token, manga)

  const response = await fetch(`${rootPath}/${manga}/Description.json:/content`, {
    method: 'PUT',
    headers: new Headers([
      ['Authorization', `Bearer ${token}`],
      ['Content-Type', 'application/json']
    ]),
    body: JSON.stringify({
      ...details,
      chapters: details.chapters.map(ch => ({
        ...ch,
        read: asRead === true ? (readDate ?? new Date()).toISOString() : false
      }))
    })
  })
  console.log(await response.json())
}

export async function moveChapter(token, manga, chapterPath, shouldMoveUp) {
  const details = await getMangaDetail(token, manga),
    chapters = details.chapters
      .filter(ch => !ch.hidden)
      .map(ch => ({ ...ch, realIndex: ch.newIndex === null ? ch.index : ch.newIndex })),
    currentChapterIndex = chapters.find(ch => ch.path === chapterPath).realIndex,
    newChapterIndex = shouldMoveUp
      ? chapters.reduce((pr, cu) => (cu.realIndex > pr && cu.realIndex < currentChapterIndex ? cu.realIndex : pr), -1)
      : chapters.reduce(
          (pr, cu) => (cu.realIndex < pr && cu.realIndex > currentChapterIndex ? cu.realIndex : pr),
          Number.MAX_SAFE_INTEGER
        ),
    newChapterPath = chapters.find(ch => ch.realIndex === newChapterIndex).path

  let newChapters = details.chapters

  if (newChapterIndex !== -1 && newChapterIndex !== Number.MAX_SAFE_INTEGER) {
    const swapperArrayIndex = newChapters.findIndex(ch => ch.path === newChapterPath),
      currentArrayindex = newChapters.findIndex(ch => ch.path === chapterPath)
    newChapters[swapperArrayIndex].newIndex = currentChapterIndex
    newChapters[currentArrayindex].newIndex = newChapterIndex
  }

  const response = await fetch(`${rootPath}/${manga}/Description.json:/content`, {
    method: 'PUT',
    headers: new Headers([
      ['Authorization', `Bearer ${token}`],
      ['Content-Type', 'application/json']
    ]),
    body: JSON.stringify({ ...details, chapters: newChapters.map(ch => ({ ...ch, realIndex: undefined })) })
  })
  console.log(await response.json())
}
