// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
Object.assign(global, {
  crypto: require('@trust/webcrypto')
});
