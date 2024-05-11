export default eventHandler((event) => {
  const reqCode = getRouterParam(event, 'code') || '200'
  let code = parseInt(reqCode)
  if (isNaN(code)) {
    code = 200
  }
  if (code < 100 || code > 599) {
    code = 404
  }
  return new Response('' + code, {
    status: code,
  })
})
