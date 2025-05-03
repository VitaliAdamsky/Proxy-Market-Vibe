export const fetchCoinsFromDb = async () => {
  const dataApiUrl = process.env.DATA_API_URL;
  const dataApiKey = process.env.DATA_API_KEY;

  if (!dataApiUrl || !dataApiKey) {
    throw new Error("Missing MongoDB Data API configuration");
  }

  const mongoResponse = await fetch(`${dataApiUrl}/action/find`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": dataApiKey,
    },
    body: JSON.stringify({
      dataSource: "Cluster0",
      database: "general",
      collection: "coin-repo",
      filter: { collection: "coin-repo" },
    }),
  });

  if (!mongoResponse.ok) {
    const errorText = await mongoResponse.text();
    throw new Error(`MongoDB request failed: ${errorText}`);
  }

  const mongoData = await mongoResponse.json();
  return (mongoData.documents || []).map((doc) => ({
    symbol: doc.symbol || "unknown",
    category: doc.category || "unknown",
    imageUrl: doc.image_url || "assets/img/noname.png",
    exchanges: Array.isArray(doc.exchanges) ? doc.exchanges : [],
  }));
};
