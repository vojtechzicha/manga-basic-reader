import { MongoClient } from 'mongodb'

const { MONGO_URL, MONGO_DB } = process.env
if (!MONGO_URL) throw new Error('Missing Mongo URL in environment variables.')
if (!MONGO_DB) throw new Error('Missing Mongo database in environment variables.')

const client = new MongoClient(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
client.connect()

export const chaptersCollection = client.db(MONGO_DB).collection('chapters')
export let mangasCollection = client.db(MONGO_DB).collection('mangas')
