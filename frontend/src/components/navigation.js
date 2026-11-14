import {
  Activity, AlertOctagon, Bell, BrainCircuit, ChartNoAxesCombined,
  CircleHelp, FileClock, LayoutDashboard, Settings2, Share2,
  Terminal
} from "lucide-react";

export const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, group: "Workspace" },
  { name: "Log Analysis", icon: Terminal, group: "Workspace" },
  { name: "AI Investigation", icon: BrainCircuit, group: "Workspace" },
  { name: "Issue Explorer", icon: AlertOctagon, group: "Workspace" },
  { name: "Analysis History", icon: FileClock, group: "Workspace" },
  { name: "Alerts & Notifications", icon: Bell, group: "Operations", badge: true },
  { name: "Service Map", icon: Share2, group: "Operations" },
  { name: "Monitoring", icon: Activity, group: "Operations" },
  { name: "Reports", icon: ChartNoAxesCombined, group: "Manage" },
  { name: "Settings", icon: Settings2, group: "Manage" },
  { name: "Help & Docs", icon: CircleHelp, group: "Manage" }
];
