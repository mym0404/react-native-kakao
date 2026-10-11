# Website

This website uses [Docusaurus](https://docusaurus.io/), a static site generator.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens a browser window. Most changes appear live without restarting the server.

### Build

```
$ yarn build
```

This command generates static content in the `build` directory, which you can serve with any static hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you use GitHub Pages for hosting, this command builds the website and pushes it to the `gh-pages` branch.
