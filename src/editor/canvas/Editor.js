import Vector2 from '../../engine/physics/geometry/Vector2'
import { SIZE, TOOLS } from '../consts'
import { clearMapEntitiesAction, clearMapEntityAction, setMapEntityAction, setMapTileAction } from '../state/actions'
import drawTiles from './drawTiles'
import drawGrid from './drawGrid'
import drawCursor from './drawCursor'
import drawEntities from './drawEntities'
import loadAssets from './loadAssets'

const MOUSE_LEFT = 0
const MOUSE_MIDDLE = 1

export default class Editor {

  constructor (canvas, store) {

    this.canvas = canvas
    this.ctx = canvas.getContext('2d')

    this.store = store

    this.getState()
    this.subscribeToStore()

    // TODO decide if these are sensible numbers
    this.canvas.width = 360
    this.canvas.height = 360

    this.offset = new Vector2()
    this.calculateOffset()

    this.loadAssets().then(() => this.render())

    // handle middle mouse pan
    this.dragging = false
    this.dragStart = new Vector2()
    this.dragOffsetStart = new Vector2()

    this.currentTileIndex = null

    // TODO try and remove the -99 stuff and just use mouseover
    this.mouseTilePosition = new Vector2()
    this.mousePosition = new Vector2(-99, -99)
    this.mouseOver = false
    this.mouseDown = {
      [MOUSE_LEFT]: false,
      [MOUSE_MIDDLE]: false,
    }

    this.bindListeners()
  }

  calculateOffset () {
    this.offset.x = (this.canvas.width - (this.map.width * SIZE)) / 2
    this.offset.y = (this.canvas.height - (this.map.height * SIZE)) / 2
  }

  getState () {
    const state = this.store.getState()

    this.currentEntity = state.currentEntity
    this.selectedTool = state.selectedTool
    this.selectedTile = state.selectedTile
    this.game = state.game
    this.showGrid = state.showGrid

    // computed state
    this.map = this.game.levels[state.currentLevel]
    this.palette = this.game.palettes[state.currentPalette]
  }

  subscribeToStore () {
    this.store.subscribe(() => {
      this.getState()
      this.render()
    })
  }

  handleMouseMove = (e) => {

    this.mousePosition.x = e.pageX - this.canvas.offsetLeft
    this.mousePosition.y = e.pageY - this.canvas.offsetTop

    this.mouseTilePosition.x = Math.floor((this.mousePosition.x - this.offset.x) / SIZE)
    this.mouseTilePosition.y = Math.floor((this.mousePosition.y - this.offset.y) / SIZE)

    if (this.dragging) {

      const dx = this.mousePosition.x - this.dragStart.x
      const dy = this.mousePosition.y - this.dragStart.y

      this.offset.x = this.dragOffsetStart.x + dx
      this.offset.y = this.dragOffsetStart.y + dy

    } else {

      // bounds check
      if (this.mouseTilePosition.x >= 0 && this.mouseTilePosition.y >= 0 && this.mouseTilePosition.x < this.map.width && this.mouseTilePosition.y < this.map.height) {
        const index = (this.mouseTilePosition.y * this.map.width) + this.mouseTilePosition.x
        if (this.mouseDown[MOUSE_LEFT] && this.currentTileIndex !== index) {
          this.paintCurrent()
        }
        this.currentTileIndex = index
      } else {
        this.currentTileIndex = null
      }

    }

    this.render()
  }

  handleMouseEnter = () => {
    this.mouseOver = true
  }

  handleMouseLeave = () => {
    this.mouseOver = false
    this.currentTileIndex
  }

  handleMouseDown = (e) => {
    this.mouseDown[e.button] = true
    if (e.button === MOUSE_LEFT) {
      if (this.currentTileIndex !== null) {
        this.paintCurrent()
      }
    }
    if (e.button === MOUSE_MIDDLE) {
      this.dragging = true
      this.dragStart.copy(this.mousePosition)
      this.dragOffsetStart.copy(this.offset)
    }
  }

  handleMouseUp = (e) => {
    this.mouseDown[e.button] = false
    if (e.button === MOUSE_MIDDLE) {
      this.dragging = false
    }
  }

  paintCurrent () {

    const { x, y } = this.mouseTilePosition

    if (this.selectedTool === TOOLS.PAINT) {

      // handle tiles
      if (this.selectedTile !== null) {

        if (this.isEntityAt(x, y)) {
          this.store.dispatch(clearMapEntityAction(x, y))
        }

        this.store.dispatch(setMapTileAction(x, y, this.selectedTile))
      }

      // handle entities
      if (this.currentEntity !== null) {
        const entity = this.palette.entities.find(entity => entity.id === this.currentEntity)
        if (entity.unique) {
          this.store.dispatch(clearMapEntitiesAction(this.currentEntity))
        }
        this.store.dispatch(setMapEntityAction(x, y, this.currentEntity))
        // also set the square under the entity to "base floor" for safety
        this.store.dispatch(setMapTileAction(x, y, 1))
      }
    }

    if (this.selectedTool === TOOLS.ERASE) {
      if (this.isEntityAt(x, y)) {
        this.store.dispatch(clearMapEntityAction(x, y))
      } else {
        this.store.dispatch(setMapTileAction(x, y, 0))
      }
    }
  }

  isEntityAt (x, y) {
    return this.map.entities.some(entity => (entity.x === x && entity.y === y))
  }

  bindListeners () {
    this.canvas.addEventListener('mousemove', this.handleMouseMove)
    this.canvas.addEventListener('mouseenter', this.handleMouseEnter)
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave)
    this.canvas.addEventListener('mousedown', this.handleMouseDown)
    this.canvas.addEventListener('mouseup', this.handleMouseUp)
  }

  unbindListeners () {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove)
    this.canvas.removeEventListener('mouseenter', this.handleMouseEnter)
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave)
    this.canvas.removeEventListener('mousedown', this.handleMouseDown)
    this.canvas.removeEventListener('mouseup', this.handleMouseUp)
  }

  loadAssets () {
    const { tiles, entities } = this.palette
    return loadAssets([...tiles, ...entities])
      .then(assets => {
        this.assets = assets
      })
  }

  render () {

    if (!this.game) return
    if (!this.assets) return

    const width = this.map.width * SIZE
    const height = this.map.height * SIZE

    this.ctx.fillStyle = '#deecff'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.translate(this.offset.x, this.offset.y)

    drawTiles(this.ctx, this.map, this.assets)
    drawEntities(this.ctx, this.map, this.assets)

    if (this.showGrid) {
      drawGrid(this.ctx, width, height, '#ffffff')
    }

    if (this.currentTileIndex !== null) {
      drawCursor(
        this.ctx,
        this.mouseTilePosition.x * SIZE,
        this.mouseTilePosition.y * SIZE,
        this.currentEntity,
        this.selectedTile,
        this.selectedTool,
        this.assets
      )
    }

    this.ctx.translate(-this.offset.x, -this.offset.y)
  }
}
