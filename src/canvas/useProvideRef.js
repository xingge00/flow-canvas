import { provide, ref } from 'vue'

export default function (name, value = null) {
  const temp = ref(value)
  provide(name, temp)
  return temp
}
