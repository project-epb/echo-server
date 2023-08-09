/**
 * @param {Blob} blob
 */
export async function getFileInfoFromBlob(blob: Blob) {
  const uuid = crypto.randomUUID();
  const base64 = btoa(new Uint8Array(await blob.arrayBuffer()).reduce((data, byte) => data + String.fromCharCode(byte), ''));
  const dataURL = `data:${blob.type};base64,${base64}`;
  return {
    uuid,
    size: blob.size,
    type: blob.type,
    // @ts-ignore
    name: blob.name,
    dataURL,
  };
}
