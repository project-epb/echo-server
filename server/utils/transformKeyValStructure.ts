export async function transformKeyValStructure(form: FormData | URLSearchParams | Headers, fileFlag: URL) {
  const values: Record<string, string | string[]> = {}
  const files: any[] = []

  const insertValue = (key: string, value: string) => {
    if (values[key]) {
      if (Array.isArray(values[key])) {
        ;(values[key] as string[]).push(value)
      } else {
        values[key] = [values[key] as string, value]
      }
    } else {
      values[key] = value
    }
  }

  for (const [key, value] of form.entries()) {
    if (value instanceof Blob) {
      const fileInfo = await getFileInfoFromBlob(value)
      files.push(fileInfo)
      insertValue(key, new URL(`/${fileInfo.id}`, fileFlag).href)
    } else {
      insertValue(key, value)
    }
  }

  return { values, files }
}
