import React from 'react'
import { renderToString } from 'react-dom/server'
import { flushToHTML } from 'styled-jsx/server'
import User from '../models/User'
import World from '../models/World'
import EditPage from '../../client/pages/EditPage'
import html from '../templates/index.html'
import getAssetsForEntry from '../util/getAssetsForEntry'

export default async function (request, response) {

  const { authorSlug, worldSlug } = request.params

  const author = await User.findOne({ slug: authorSlug }).exec()

  if (author === null) {
    return response.sendStatus(404)
  }

  const world = await World.findOne({ slug: worldSlug, author: author._id }).exec()

  if (world === null) {
    return response.sendStatus(404)
  }

  const content = renderToString(
    <EditPage world={world} />
  )

  const styles = flushToHTML()
  const scripts = getAssetsForEntry('header')

  response.send(html(content, scripts, styles))
}
