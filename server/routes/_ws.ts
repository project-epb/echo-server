import { Peer } from 'crossws'

export default defineWebSocketHandler({
  open(peer) {
    console.log('[ws] open', peer)
    peer.send(peer.url.endsWith('/full') ? createMessageBody(peer, 'WebSocket hello!') : peer.url)
  },

  message(peer, message) {
    console.log('[ws] message', peer, message)
    const text = message.text()
    peer.send(peer.url.endsWith('/full') ? createMessageBody(peer, text) : text)
  },

  close(peer, event) {
    console.log('[ws] close', peer, event)
  },

  error(peer, error) {
    console.log('[ws] error', peer, error)
  },
})

function createMessageBody(peer: Peer, message: string) {
  return {
    kind: 'message',
    message,
    id: peer.id,
    addr: peer.addr,
    url: peer.url,
    headers: Object.fromEntries(Object.entries(peer.headers)),
    readyState: peer.readyState,
    timestamp: Date.now(),
  }
}
