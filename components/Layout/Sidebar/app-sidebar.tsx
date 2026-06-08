"use client"

import * as React from "react"
import {
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  LayoutDashboard,
  PlusSquare,
  GraduationCap,
  ClipboardCheck,
  BookOpen,
  CalendarCheck,
  BarChart3,
  History,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { NavMain, type NavMainItem } from "./nav-main"
import { NavUser } from "./nav-user"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Teacher",
      url: "/dashboard/teacher",
      icon: BookOpen,
    },
    {
      title: "Daily Log",
      url: "/dashboard/daily-log",
      icon: CalendarCheck,
    },
    {
      title: "Create",
      url: "/dashboard/create",
      icon: PlusSquare,
    },
    {
      title: "Students",
      url: "/dashboard/students",
      icon: GraduationCap,
    },
    {
      title: "Analytics",
      url: "/dashboard/analytics",
      icon: BarChart3,
    },
    {
      title: "History",
      url: "/dashboard/history",
      icon: History,
    },
    {
      title: "Attendance",
      url: "/dashboard/attendance",
      icon: ClipboardCheck,
    },
  ] as NavMainItem[],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
