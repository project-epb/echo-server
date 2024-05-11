export function safelyStringify(data: any, space = 0) {
  const walked = new WeakSet();
  return JSON.stringify(
    data,
    (_, value) => {
      if (typeof value === 'object' && value !== null) {
        if (walked.has(value)) {
          return '[Circular]';
        }
        walked.add(value);
      }
      if (typeof value === 'function') {
        return value.toString();
      }
      if (typeof value === 'bigint') {
        return value.toString() + 'n';
      }
      return value;
    },
    space
  );
}
