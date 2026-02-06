import type { LucideIcon, LucideProps } from "lucide-react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Bell,
  Building,
  Calendar,
  CalendarClock,
  Camera,
  ChartArea,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleFadingArrowUp,
  CloudUpload,
  Download,
  Ellipsis,
  Eye,
  EyeClosed,
  File,
  Files,
  FileText,
  Flag,
  Globe,
  ListChecks,
  Loader2,
  LogOut,
  MessageCircleReply,
  MessageCircleWarning,
  MessageSquareCode,
  MinusCircle,
  Moon,
  Palette,
  PencilLine,
  Plane,
  PlusCircle,
  Puzzle,
  Scale,
  Search,
  Settings2,
  Sparkles,
  StickyNote,
  Sun,
  Tag,
  Tickets,
  Trash,
  UserCog,
  UserRound,
  X,
} from "lucide-react";
import { forwardRef } from "react";

// Custom AI icon - simple and unique
const AIIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Simple "S" shape representing SILO AI */}
      <path d="M12 3v4" />
      <circle cx="12" cy="10" r="3" />
      <path d="M12 13v2" />
      <path d="M8 18h8" />
      <circle cx="8" cy="18" r="1.5" fill="currentColor" />
      <circle cx="16" cy="18" r="1.5" fill="currentColor" />
      <path d="M8 18v3" />
      <path d="M16 18v3" />
    </svg>
  )
);
AIIcon.displayName = "AIIcon";

export type Icon = LucideIcon;

export const Icons = {
  account: UserCog,
  add: PlusCircle,
  ai: AIIcon,
  analytics: ChartArea,
  arrowLeft: ArrowLeft,
  arrowUpDown: ArrowUpDown,
  automaticReplies: MessageCircleReply,
  bell: Bell,
  calendar: Calendar,
  calendarRange: CalendarClock,
  camera: Camera,
  categories: ListChecks,
  checkCircle: CheckCircle,
  chevronDown: ChevronDown,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  close: X,
  edit: PencilLine,
  eye: Eye,
  eyeClosed: EyeClosed,
  file: File,
  files: Files,
  fileText: FileText,
  flag: Flag,
  language: Globe,
  logo: Scale,
  logout: LogOut,
  minus: MinusCircle,
  moon: Moon,
  more: Ellipsis,
  organization: Building,
  palette: Palette,
  remove: Trash,
  request: MessageSquareCode,
  resend: Plane,
  search: Search,
  settings: Settings2,
  sparkles: Sparkles,
  spinner: Loader2,
  sun: Sun,
  tag: Tag,
  teams: Puzzle,
  template: StickyNote,
  tickets: Tickets,
  upgrade: CircleFadingArrowUp,
  upload: CloudUpload,
  user: UserRound,
  warning: MessageCircleWarning,
  alertCircle: AlertCircle,
  circleCheck: CircleCheck,
  download: Download,
};
