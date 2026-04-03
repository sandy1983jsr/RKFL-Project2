import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { apiRouter } from './routes/api'

const app = new Hono()

app.use('*', cors())
app.use('/static/*', serveStatic({ root: './' }))

// API routes
app.route('/api', apiRouter)

// Serve main app for all other routes (SPA)
app.get('*', (c) => {
  return c.html(getMainHTML())
})

function getMainHTML(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>RKFL Green Command & Control | PwC Sustainability</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet"/>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
  <link rel="stylesheet" href="/static/styles.css"/>
</head>
<body class="bg-gray-950 text-gray-100 font-sans">
  <div id="app"></div>
  <script src="/static/app.js"></script>
</body>
</html>`
}

export default app
