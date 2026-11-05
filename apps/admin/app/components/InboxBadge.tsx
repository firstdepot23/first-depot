import { SidebarMenuBadge } from "./ui/sidebar";
import { getInboxCount } from "../lib/resendEmails";

// Server component: the number of quote requests nobody has handled yet
// (status "new"). Shows nothing when there are none or the count can't load,
// so the sidebar never displays a made-up number.
const InboxBadge = async () => {
  const count = await getInboxCount();
  if (count <= 0) return null;
  return <SidebarMenuBadge>{count > 99 ? "99+" : count}</SidebarMenuBadge>;
};

export default InboxBadge;
