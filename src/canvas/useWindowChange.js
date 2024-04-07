import { onBeforeUnmount, onMounted } from 'vue'

export default function (doFn = () => {}) {
  doFn()
  let timer = null
  const windowChange = () => {
    if (timer) return
    timer = setTimeout(() => {
      doFn()
      timer = null
    }, 200)
  }
  onMounted(() => {
    window.addEventListener('resize', windowChange)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', windowChange)
    clearTimeout(timer)
  })
}
