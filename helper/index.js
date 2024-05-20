export function once(fn, ctx = null) {
  let res
  return (...args) => {
    if (fn) {
      res = fn.apply(ctx, args)
      fn = null
    }
    return res
  }
}

export const getNavbarHeight = () => {
  const { height, top } = document.querySelector('.navbar').getBoundingClientRect()
  return height + top
}
