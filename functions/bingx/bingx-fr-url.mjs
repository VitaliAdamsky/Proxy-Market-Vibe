export function bingXFrUrl(symbol, limit) {
  return `https://open-api.bingx.com/openApi/swap/v2/quote/fundingRate?symbol=${symbol.replace(
    /(USDT)$/,
    "-$1"
  )}&limit=${limit}`;
}
