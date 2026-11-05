import {
  Home,
  Inbox,
  Calendar,
  Search,
  Settings,
  Plus,
  Shirt,
  User,
  ShoppingBasket,
  ShoppingCart,
  Pill,
  Hammer,
  UtensilsCrossed,
  Newspaper,
} from "lucide-react";
import { SEGMENT_LABELS, SEGMENT_ORDER, type Segment } from "@repo/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "./ui/sidebar";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import InboxBadge from "./InboxBadge";
import { Sheet, SheetTrigger } from "./ui/sheet";
import AddOrder from "./AddOrder";
import AddUser from "./AddUser";
import AddCategory from "./AddCategory";
import AddProduct from "./AddProduct";
import SidebarUserMenu from "./SidebarUserMenu";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Inbox",
    url: "/emails",
    icon: Inbox,
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
];

const segmentIcons: Record<Segment, typeof Hammer> = {
  GROCERY: ShoppingCart,
  FASTFOOD: UtensilsCrossed,
  PHARMACY: Pill,
  HARDWARE: Hammer,
};

const AppSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Image src="/logo.svg" alt="logo" width={20} height={20} />
                <span>FIRST DEPOT</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.title === "Inbox" && (
                    <Suspense fallback={null}>
                      <InboxBadge />
                    </Suspense>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Products</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/products">
                    <Shirt />
                    See All Products
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* One section per segment, in the order Grocery, Pharmacy,
            Hardware (SEGMENT_ORDER). */}
        {SEGMENT_ORDER.map((segment) => {
          const Icon = segmentIcons[segment];
          const label = SEGMENT_LABELS[segment];
          return (
            <SidebarGroup key={segment}>
              <SidebarGroupLabel>{label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href={`/products?segment=${segment}`}>
                        <Icon />
                        See {label} Products
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Sheet>
                      <SheetTrigger asChild>
                        <SidebarMenuButton>
                          <Plus />
                          <span>Add {label} Products</span>
                        </SidebarMenuButton>
                      </SheetTrigger>

                      <AddProduct segment={segment} />
                    </Sheet>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Sheet>
                      <SheetTrigger asChild>
                        <SidebarMenuButton>
                          <Plus />
                          <span>Add {label} Category</span>
                        </SidebarMenuButton>
                      </SheetTrigger>

                      <AddCategory defaultSegment={segment} />
                    </Sheet>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
        <SidebarGroup>
          <SidebarGroupLabel>Blog</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Link href="/blogs/new">
              <Plus /> <span className="sr-only">Add Blog Post</span>
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/blogs">
                    <Newspaper />
                    See All Posts
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/blogs/new">
                    <Plus />
                    <span>Add Post</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Users</SidebarGroupLabel>
          <SidebarGroupAction>
            <Plus /> <span className="sr-only">Add User</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/users">
                    <User />
                    See All Users
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton>
                      <Plus />
                      <span>Add User</span>
                    </SidebarMenuButton>
                  </SheetTrigger>

                  <AddUser />
                </Sheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Orders / Payments</SidebarGroupLabel>
          <SidebarGroupAction>
            <Plus /> <span className="sr-only">Add Order</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/orders">
                    <ShoppingBasket />
                    See All Transactions
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <SidebarMenuButton>
                      <Plus />
                      <span>Add Order</span>
                    </SidebarMenuButton>
                  </SheetTrigger>

                  <AddOrder />
                </Sheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* The signed-in user (name, email, photo) with Account and Sign out */}
            <SidebarUserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
