import { Object3D } from 'three/src/core/Object3D'
import Physics from './Physics'
import createTiles from './create/createTiles'
import createEntities from './create/createEntities'

export default function createWorld (game, assets, controller) {

  Physics.clearColliders()

  const world = new Object3D()

  // TODO current level
  const map = game.levels[0]
  const palette = game.palettes[0]

  // TODO split collider stuff out
  const [ tiles, tileColliders ] = createTiles(map, palette, assets)

  if (tiles.length) world.add(...tiles)

  Physics.addColliders(tileColliders)

  const [ entities, entityColliders ] = createEntities(map, palette, assets, controller)

  if (entities.length) world.add(...entities)

  Physics.addColliders(entityColliders)

  return world
}
