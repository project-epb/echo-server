export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)
  const now = performance.now()
  const timeout = Math.max(0, Math.min(60, +getQuery(event).timeout || 10))

  const interval = setInterval(async () => {
    if (performance.now() - now > timeout * 1000) {
      await handleCleanup()
    } else {
      await eventStream.push('' + Date.now())
    }
  }, 1000)

  const handleCleanup = async () => {
    clearInterval(interval)
    await eventStream.close()
  }

  eventStream.onClosed(async () => {
    await handleCleanup()
  })

  return eventStream.send()
})
