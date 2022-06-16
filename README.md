# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## OneDrive Authorization

````

1ONEDRIVE_CLIENT_ID=76df37c8-219b-4dad-b7ff-671578eaf820
ONEDRIVE_CLIENT_SECRET=62F8Q~XAg-7tQy1Jk~wvip3QMLMbJkAfBGB6Gcyh
ONEDRIVE_AUTHORIZE_URL="https://login.live.com/oauth20_authorize.srf"
ONEDRIVE_TOKEN_URL="https://login.live.com/oauth20_token.srf"
ONEDRIVE_CALLBACK_URL="http://localhost:3000/callback"

SESSION_SECRET=a4htuqw34ghpt58q2340-tv56

MONGO_URL="mongodb+srv://mangaUser:MQCeCkGuaguCF2IB@manga-reader-database.2uohq.mongodb.net/?retryWrites=true&w=majority"
MONGO_DB="manga-reader-database"```

- `mongodump --uri mongodb+srv://mangaUser:MQCeCkGuaguCF2IB@manga-reader-database.2uohq.mongodb.net/manga-reader-database`

## Development

From your terminal:

```sh
npm run dev
````

This starts your app in development mode, rebuilding assets on file changes.

## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `remix build`

- `build/`
- `public/build/`

### Using a Template

When you ran `npx create-remix@latest` there were a few choices for hosting. You can run that again to create a new project, then copy over your `app/` folder to the new project that's pre-configured for your target server.

```sh
cd ..
# create a new project, and pick a pre-configured host
npx create-remix@latest
cd my-new-remix-app
# remove the new project's app (not the old one!)
rm -rf app
# copy your app over
cp -R ../my-old-remix-app/app app
```
