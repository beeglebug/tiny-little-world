import { SpriteMaterial } from 'three/src/materials/SpriteMaterial'
import { Sprite } from 'three/src/objects/Sprite'
import { ENTITY_TYPE, TILE_SIZE } from '../consts'
import Rect from '../physics/geometry/Rect'

export default function createEntities (map, palette, assets, controller) {

  const entities = []
  const colliders = []

  map.entities.forEach(entity => {

    const entityDefinition = palette.entities.find(({ id }) => id === entity.id)
    const dx = entity.x * TILE_SIZE
    const dy = entity.y * TILE_SIZE

    switch (entity.id) {
      case ENTITY_TYPE.PLAYER:
        // just set player position, nothing to add to world
        // TODO player orientation?
        controller.position.set(entity.x * TILE_SIZE, 0, entity.y * TILE_SIZE)
        break
      case ENTITY_TYPE.DOOR:
        const mesh = assets.meshes[entityDefinition.mesh].clone()
        mesh.position.set(dx, 0, dy)
        // TODO define this somewhere properly
        const collider = new Rect(
          dx - TILE_SIZE / 2,
          dy - TILE_SIZE / 4,
          TILE_SIZE,
          TILE_SIZE / 2
        )
        entities.push(mesh)
        colliders.push(collider)
        break
      case ENTITY_TYPE.KEY:
        const map = assets.textures[entityDefinition.texture]
        const spriteMaterial = new SpriteMaterial({ map, color: 0xffffff })
        const sprite = new Sprite(spriteMaterial)
        sprite.position.set(dx, 0.2, dy)
        entities.push(sprite)
        break
    }

  })

  return [ entities, colliders ]
}
