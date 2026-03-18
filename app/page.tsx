import { redirect } from "next/navigation";

export default function Home() {
  try {
    redirect("/dashboard");
  } catch (e) {
    // Next.js redirect() throws a special NEXT_REDIRECT error internally —
    // re-throw it so the framework handles the redirect correctly.
    throw e;
  }
}
