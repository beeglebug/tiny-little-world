import EventEmitter from 'eventemitter3'
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer'
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera'
import { Object3D } from 'three/src/core/Object3D'
import createScene from './createScene'
import CharacterController from './CharacterController'
import Input from './input/Input'
import loop from './loop'
import createContent from './createContent'
import loadAssets from './loadAssets'
import Physics from './Physics'
import renderReticle from './2d/renderReticle'
import createCanvas from './util/createCanvas'
import createUI from './ui'
import { START_DIALOGUE, STOP_DIALOGUE } from './events'
import KeyCode from './input/KeyCode'

export default class Engine extends EventEmitter {

  constructor (container, width, height) {

    super()

    this.container = container
    this.container.style.position = 'relative'
    this.container.style.width = `${width}px`
    this.container.style.height = `${height}px`

    // setup dom
    this.canvas3d = createCanvas(width, height)
    this.canvas3d.tabIndex = 1 // needed for keyboard input

    this.canvas2d = createCanvas(width, height)

    this.ctx = this.canvas2d.getContext('2d')
    this.ctx.imageSmoothingEnabled = false

    const element = createUI(this)

    this.container.appendChild(this.canvas3d)
    this.container.appendChild(this.canvas2d)
    this.container.appendChild(element)

    this.setupPointerLock(this.canvas3d)

    this.scene = createScene()
    this.renderer = new WebGLRenderer({ canvas: this.canvas3d })
    this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000)

    // TODO from config
    this.controls = {
      forward: Input.createButton('forward', KeyCode.W, KeyCode.UpArrow),
      back: Input.createButton('back', KeyCode.S, KeyCode.DownArrow),
      left: Input.createButton('left', KeyCode.A, KeyCode.LeftArrow),
      right: Input.createButton('right', KeyCode.D, KeyCode.RightArrow),
      interact: Input.createButton('interact', KeyCode.E),
      // run: Input.createButton('run', KeyCode.LeftShift),
    }

    this.controller = new CharacterController(this.camera, this.controls)
    this.scene.add(this.controller)

    // bind stuff via events
    this.addListener(START_DIALOGUE, () => {
      this.controller.disable()
    })

    this.addListener(STOP_DIALOGUE, () => {
      this.controller.enable()
    })
  }

  load (game) {

    this.clear()

    const assets = loadAssets(game)

    this.world = new Object3D()

    const [ tiles, entities ] = createContent(game, assets, this)

    if (tiles.length) this.world.add(...tiles)
    if (entities.length) this.world.add(...entities)

    const entityColliders = entities
      .filter(obj => obj.collider)
      .map(obj => obj.collider)

    const tileColliders = tiles
      .filter(obj => obj.collider)
      .map(obj => obj.collider)

    // TODO handle colliders separately to allow for easy broadphase on tiles
    Physics.setColliders([...entityColliders, ...tileColliders])

    this.tiles = tiles
    this.entities = entities

    this.scene.add(this.world)

    this.controller.resetRotation(Math.PI, 0)
    this.controller.handlePhysics() // force update the 2d collider
  }

  start () {
    Input.bind(this.canvas3d)

    this.canvas3d.focus()
    this.canvas3d.requestPointerLock()

    this.cancelLoop = loop(this.tick)
  }

  clear () {
    Physics.clearColliders()
    if (this.world) {
      // loop backwards to a void mid loop splice reindexing
      for (let i = this.world.children.length - 1; i >= 0; i--) {
        this.world.remove(this.world.children[i])
      }
    }
  }

  stop () {
    Input.unbind(this.canvas3d)
    this.canvas3d.blur()
    this.cancelLoop()
    this.onStop && this.onStop()
  }

  tick = (deltaTime) => {

    // TODO actual broadphase
    const nearbyEntities = this.entities

    this.controller.update(deltaTime, nearbyEntities)

    this.entities.forEach(entity => entity.update(this))

    this.render()

    Input.clear()
  }

  render () {
    this.renderer.render(this.scene, this.camera)

    // 2d rendering
    renderReticle(this.ctx, this.controller)
  }

  setupPointerLock (domElement) {

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === domElement) {
        this.controller.enabled = true
      } else {
        this.controller.enabled = false
        this.stop()
      }
    }

    const handlePointerLockError = (error) => {
      return console.warn('Pointer Lock Error', error)
    }

    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('pointerlockerror', handlePointerLockError)
  }
}
