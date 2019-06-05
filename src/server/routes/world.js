import React from 'react'
import { renderToString } from 'react-dom/server'
import { flushToHTML } from 'styled-jsx/server'
import User from '../models/User'
import World from '../models/World'
import html from '../templates/index.html'
import WorldPage from '../../client/pages/WorldPage'
import getAssetsForEntry from '../util/getAssetsForEntry'

export default async function (request, response) {

  const { authorSlug, worldSlug } = request.params

  let author = await User.findOne({ slug: authorSlug }).exec()

  if (author === null) {
    return response.sendStatus(404)
  }

  let world = await World.findOne({ slug: worldSlug, author: author._id }).exec()

  if (world === null) {
    return response.sendStatus(404)
  }

  author = author.toObject()
  world = world.toObject()

  const content = renderToString(
    <WorldPage
      author={author}
      world={world}
    />
  )

  const styles = flushToHTML()
  const scripts = getAssetsForEntry('header')

  response.send(html(content, scripts, styles))
}