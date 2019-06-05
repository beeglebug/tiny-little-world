import React from 'react'
import { renderToString } from 'react-dom/server'
import { flushToHTML } from 'styled-jsx/server'
import World from '../models/World'
import html from '../templates/index.html'
import HomePage from '../../client/pages/HomePage'
import getAssetsForEntry from '../util/getAssetsForEntry'

export default async function (request, response) {

  // TODO only get a subset of fields
  let worlds = await World
    .find({})
    .populate('author')
    .exec()

  worlds = worlds.map(world => world.toObject())

  const content = renderToString(
    <HomePage worlds={worlds} />
  )

  const styles = flushToHTML()
  const scripts = getAssetsForEntry('header')

  response.send(html(content, scripts, styles))
}