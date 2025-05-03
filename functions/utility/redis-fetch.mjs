const UPSTASH_REDIS_REST_URL = process.env.KV_REST_API_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.KV_REST_API_TOKEN;

export async function redisFetch(command, args) {
  const url = `${UPSTASH_REDIS_REST_URL}/${command}/${args
    .map(encodeURIComponent)
    .join("/")}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    method: "GET",
  });
  return response.json();
}
