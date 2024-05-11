export default eventHandler((event) => {
  console.error('Error:', event)
  return {
    error: true,
  }
})
