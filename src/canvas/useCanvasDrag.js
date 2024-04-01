import { computed, onBeforeUnmount, onMounted, ref, unref } from 'vue'
import { useEventListener } from '@vueuse/core'

export default function (elQuery) {
  // 拖动距离和节点移动比率
  const DRAG_RATIO = 1
  let tempPos = [0, 0]
  const positionDist = ref([0, 0])
  const calcDist = ref([0, 0])

  // 当前画板的比例100为正常
  const curRatio = ref(100)
  const scale = computed(() => curRatio.value / 100)
  const SCALE_STEP = 10
  const toZoom = (calcVal) => {
    if (calcVal === 0) return

    const temp = curRatio.value + calcVal
    if (calcVal > 0 && temp >= 300) return false
    if (calcVal < 0 && temp <= 10) return false

    curRatio.value += calcVal
    return true
  }
  const handleMouseDown = (e) => {
    const isScale = e.touches && e.touches.length > 1

    let moveFn
    // 拖动缩放
    if (isScale) {
      const handleScale = () => {
        const one = {
          x: e.touches[0].screenX, // 第一根手指的横坐标
          y: e.touches[0].screenY, // 第一根手指的横坐标
        }
        const two = {
          x: e.touches[1].screenX, // 第二根手指的横坐标
          y: e.touches[1].screenY, // 第二根手指的横坐标
        }
        const getDistance = (start, stop) => { // 计算两根手指之间的距离
          return Math.sqrt(Math.pow(Math.abs(start.x - stop.x), 2) + Math.pow(Math.abs(start.y - stop.y), 2))
        }
        const firstDistance = getDistance(one, two)

        return function (e) { // 鼠标移动的时候计算元素的位置
          if (e.touches.length > 1) {
            const events1 = e.touches[0]
            const events2 = e.touches[1]
            const one = {
              x: events1.screenX, // 第一根手指的横坐标
              y: events1.screenY, // 第一根手指的横坐标
            } // 第一根手指的横坐标
            const two = {
              x: events2.screenX, // 第二根手指的横坐标
              y: events2.screenY, // 第二根手指的横坐标
            }
            const distance = getDistance(one, two)
            const zoom = distance / firstDistance
            if (zoom > 1) {
              toZoom(5)
              // firstDistance = distance
            }
            if (zoom < 1) {
              toZoom(-5)
              // firstDistance = distance
            }
          }
        }
      }
      moveFn = handleScale()
      document.onmousemove = moveFn
      document.ontouchmove = moveFn
      return
    }

    // 排除节点拖动和分支拖动的情况(即：拖动初始位置在canvas-mian，或者最外层的render-list-wrapper)
    if (![...e.target.classList].includes('canvas-main')
    && !([...e.target.classList].includes('render-list-wrapper') && e.target.attributes.draggable?.value !== 'true')
    ) return

    e.target.style.cursor = 'grab'

    const getPosition = e => [
      e.screenX ?? e.touches[0].screenX,
      e.screenY ?? e.touches[0].screenY,
    ]
    tempPos = getPosition(e)
    moveFn = function (e) { // 鼠标移动的时候计算元素的位置
      e.preventDefault?.()
      e.target.style.cursor = 'grabbing'
      // console.log('onmousemove', e.screenX ?? e.touches[0].screenX)

      const curPos = getPosition(e)
      calcDist.value = [
        (curPos[0] - tempPos[0]) * DRAG_RATIO,
        (curPos[1] - tempPos[1]) * DRAG_RATIO,
      ]
    }
    document.onmousemove = moveFn
    document.ontouchmove = moveFn
  }
  const handleMouseUp = (e) => {
    if (e?.target?.style) {
      e.target.style.cursor = 'default'
    }

    const [x, y] = positionDist.value
    const [xc, yc] = calcDist.value
    positionDist.value = [x + xc, y + yc]
    calcDist.value = [0, 0]
    document.onmousemove = null
    document.ontouchmove = null
  }

  let canvasMain = null

  const handleMouseWheel = (e) => {
    e.preventDefault?.()

    const [x, y] = positionDist.value

    const down = e.wheelDelta ? e.wheelDelta < 0 : e.detail > 0

    if (!e.ctrlKey) {
      if (down) positionDist.value = [x, y - 30]
      else positionDist.value = [x, y + 30]
      return
    }

    const { width = 0, height = 0 } = canvasMain?.getBoundingClientRect() || {}
    const { pageX, pageY } = e

    const [xc, yc] = [width / 2, height / 2]
    const [distX, distY] = [(pageX - xc) / xc * 20, (pageY - yc) / yc * 20]

    if (down) {
      if (!toZoom(-SCALE_STEP)) return
      positionDist.value = [x + distX, y + distY]
    } else {
      if (!toZoom(SCALE_STEP)) return
      positionDist.value = [x - distX, y - distY]
    }
  }

  let mousedownClear,
    touchstartClear,
    mouseupClear,
    touchendClear,
    mouseleaveClear,
    mousewheelClear

  onMounted(() => {
    canvasMain = document.querySelector(unref(elQuery))

    mousedownClear = useEventListener(canvasMain, 'mousedown', handleMouseDown)
    touchstartClear = useEventListener(canvasMain, 'touchstart', handleMouseDown)
    mouseupClear = useEventListener(canvasMain, 'mouseup', handleMouseUp)
    touchendClear = useEventListener(canvasMain, 'touchend', handleMouseUp)
    // 监听页面的mouseleave事件，当鼠标移出浏览器页面可用区域 并 松开按键时，停止拖动
    mouseleaveClear = useEventListener(canvasMain, 'mouseleave', handleMouseUp)

    mousewheelClear = useEventListener(canvasMain, 'mousewheel', handleMouseWheel)
  })

  onBeforeUnmount(() => {
    mousedownClear()
    touchstartClear()
    mouseupClear()
    touchendClear()
    mouseleaveClear()
    mousewheelClear()
  })

  return {
    positionDist, // 定位偏移
    calcDist, // 拖动偏移
    scale, // 缩放大小
  }
}
