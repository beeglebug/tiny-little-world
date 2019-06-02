export default (content, preloadedState, scripts, css) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Tiny Little Worlds</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/png" href="favicon.png" />
  <style>
    html, body {
      padding: 0;
      margin: 0;
      height: 100%;
      background-color: #90afc5;
    }
    body, button, input, textarea {
      font-size: 14px;
      font-family: Helvetica, sans-serif;
      color: #69779b;
    }
    h1, h2, h3 {
      margin: 0;
      font-size: 14px;
    }
    #root {
      height: 100%;
    }
    @font-face {
      font-family: m5x7;
      src: url('/m5x7.ttf');
      font-weight: 400;
    }
    .modal-open {
      overflow: hidden;
    }
  </style>
  <style>${[...css].join('')}</style>
</head>
<body>
  <div id="root">${content}</div>
  <script>
    window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState)}
  </script>
  ${scripts.map(toScriptTag).join('')}
</body>
</html>`

function toScriptTag (src) {
  return `<script src="${src}"></script>`
}