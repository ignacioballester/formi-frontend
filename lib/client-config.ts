// Helper function to fetch configuration safely from the server
export async function getClientConfig() {
  const response = await fetch("/api/config")
  if (!response.ok) {
    throw new Error("Failed to load configuration")
  }
  return response.json()
}
