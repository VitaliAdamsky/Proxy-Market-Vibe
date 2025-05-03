export function bingXOiUrl(symbol) {
  return `https://open-api.bingx.com/openApi/swap/v2/quote/openInterest?symbol=${symbol.replace(
    /(USDT)$/,
    "-$1"
  )}`;
}
