# Welcome to Remix!

- [Remix Docs](https://remix.run/docs)

## OneDrive Authorization

- Name: `Basic Manga Reader`
- Application (client) ID: `76df37c8-219b-4dad-b7ff-671578eaf820`
- Object ID: `649f9be5-948c-483a-b4b0-5384bea019bf`
- Directory (tenant) ID: `debf8d83-3e33-48f2-ae95-ee3173a6684a`
- Client Secret Description: `basic-manga-reader-server`
- Client Secret ID: `8f4be5d0-a39d-4430-847a-0eaf1fce7fe0`
- Client Secret Value: `2RX8Q~m26.uAgiKJuGCydj9dITY6zShlbxnBtbH6`

## Development

From your terminal:

```sh
npm run dev
```

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
