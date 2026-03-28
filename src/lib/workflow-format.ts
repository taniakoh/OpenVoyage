export function formatWorkflowTime(value: string) {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Singapore"
  }).format(new Date(value));
}

export function formatWorkflowSite(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
