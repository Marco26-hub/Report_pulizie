import { requireUser } from "@/lib/auth";
import ProfileEditor from "./ProfileEditor";

export default async function ProfilePage() {
  const { user, profile } = await requireUser();
  return <ProfileEditor user={user} profile={profile} />;
}
