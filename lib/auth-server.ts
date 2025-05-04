import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"

export const auth = async () => {
  return await getServerSession(authOptions)
}
