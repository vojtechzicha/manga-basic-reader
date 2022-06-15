import { MongoClient } from 'mongodb'

const { MONGO_URL, MONGO_DB } = process.env
if (!MONGO_URL) throw new Error('Missing Mongo URL in environment variables.')
if (!MONGO_DB) throw new Error('Missing Mongo database in environment variables.')

let db = null
if (__db === undefined) {
  global.__db = null
}

if (process.env.NODE_ENV === 'production') {
  db = new MongoClient(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  db.connect()
} else {
  if (!__db) {
    __db = new MongoClient(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    __db.connect()
  }
  db = __db
}

export const chaptersCollection = db.db(MONGO_DB).collection('chapters')
export const mangasCollection = db.db(MONGO_DB).collection('mangas')
