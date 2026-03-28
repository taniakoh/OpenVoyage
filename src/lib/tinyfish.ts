export function getTinyFishConfig() {
  return {
    baseUrl: process.env.TINYFISH_BASE_URL || "https://agent.tinyfish.ai",
    apiKey: process.env.TINYFISH_API_KEY || ""
  };
}

export function tinyFishEnabled() {
  return Boolean(process.env.TINYFISH_API_KEY);
}
