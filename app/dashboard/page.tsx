
// "use client";

// import { useState, useEffect, useCallback, useMemo } from "react";
// import { motion } from "framer-motion";
// import {
//   Brain,
//   Calendar,
//   Activity as ActivityIcon,
//   Sun,
//   Moon,
//   Heart,
//   Trophy,
//   Bell,
//   Sparkles,
//   BrainCircuit,
//   ArrowRight,
//   Loader2,
//   MessageSquare,
//   ListTree,
//   ChevronDown,
//   ChevronUp,
//   Clock,
//   Dot,
// } from "lucide-react";

// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Container } from "@/components/ui/container";
// import { cn } from "@/lib/utils";
// import { MoodForm } from "@/components/mood/mood-form";
// import { AnxietyGames } from "@/components/games/anxiety-games";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
// } from "@/components/ui/dialog";

// import {
//   addDays,
//   format,
//   subDays,
//   startOfDay,
//   isWithinInterval,
// } from "date-fns";

// import { ActivityLogger } from "@/components/activities/activity-logger";
// import { useSession } from "@/lib/contexts/session-context";
// import { getAllChatSessions } from "@/lib/api/chat";
// import { getUserActivities, logActivity } from "@/lib/api/activity";

// const API_BASE =
//   process.env.NEXT_PUBLIC_BACKEND_URL || "https://ai-agents-backend-2.onrender.com";

// /* ============================
//    Types
// ============================= */
// interface Activity {
//   id: string;
//   userId: string | null;
//   type: string;
//   name: string;
//   description: string | null;
//   timestamp: string | Date;
//   duration: number | null;
//   completed: boolean;
//   moodScore: number | null;
//   moodNote: string | null;
//   createdAt: string | Date;
//   updatedAt: string | Date;
// }

// interface DailyStats {
//   moodScore: number | null;
//   completionRate: number;
//   mindfulnessCount: number;
//   totalActivities: number;
//   lastUpdated: Date;
// }

// type ActivityLevel = "none" | "low" | "medium" | "high";

// interface DayActivity {
//   date: Date;
//   level: ActivityLevel;
//   activities: {
//     type: string;
//     name: string;
//     completed: boolean;
//     time?: string;
//   }[];
// }

// /* ============================
//    Helpers
// ============================= */
// const calculateDailyStats = (activities: Activity[]): DailyStats => {
//   const today = startOfDay(new Date());

//   const todaysActivities = activities.filter((activity) =>
//     isWithinInterval(new Date(activity.timestamp), {
//       start: today,
//       end: addDays(today, 1),
//     })
//   );

//   const moodEntries = todaysActivities.filter(
//     (a) => a.type === "mood" && a.moodScore !== null
//   );

//   const averageMood =
//     moodEntries.length > 0
//       ? Math.round(
//           moodEntries.reduce(
//             (sum, curr) => sum + (curr.moodScore || 0),
//             0
//           ) / moodEntries.length
//         )
//       : null;

//   const therapySessions = activities.filter((a) => a.type === "therapy").length;

//   return {
//     moodScore: averageMood,
//     completionRate: 100,
//     mindfulnessCount: therapySessions,
//     totalActivities: todaysActivities.length,
//     lastUpdated: new Date(),
//   };
// };

// const generateInsights = (activities: Activity[]) => {
//   const insights: {
//     title: string;
//     description: string;
//     icon: any;
//     priority: "low" | "medium" | "high";
//   }[] = [];

//   const lastWeek = subDays(new Date(), 7);
//   const recentActivities = activities.filter(
//     (a) => new Date(a.timestamp) >= lastWeek
//   );

//   const moodEntries = recentActivities.filter(
//     (a) => a.type === "mood" && a.moodScore !== null
//   );

//   if (moodEntries.length >= 2) {
//     const averageMood =
//       moodEntries.reduce((sum, curr) => sum + (curr.moodScore || 0), 0) /
//       moodEntries.length;

//     const latestMood = moodEntries[moodEntries.length - 1].moodScore || 0;

//     if (latestMood > averageMood) {
//       insights.push({
//         title: "Mood Improvement",
//         description:
//           "Your recent mood scores are above your weekly average. Keep it up!",
//         icon: Brain,
//         priority: "high",
//       });
//     } else if (latestMood < averageMood - 20) {
//       insights.push({
//         title: "Mood Drop Detected",
//         description:
//           "Your mood seems lower than usual. Try a calming activity?",
//         icon: Heart,
//         priority: "high",
//       });
//     }
//   }

//   return insights.slice(0, 3);
// };

// /* ============================
//    Dashboard (Part 1)
// ============================= */
// export default function Dashboard() {
//   const [mounted, setMounted] = useState(false);
//   const [currentTime, setCurrentTime] = useState(new Date());
//   const { user } = useSession();

//   const [insights, setInsights] = useState<any[]>([]);
//   const [activities, setActivities] = useState<Activity[]>([]);
//   const [showMoodModal, setShowMoodModal] = useState(false);
//   const [showActivityLogger, setShowActivityLogger] = useState(false);

//   // NEW: toggle to show/hide the inline timeline
//   const [showTimeline, setShowTimeline] = useState(true);
//   const [isRefreshingStats, setIsRefreshingStats] = useState(false);

//   const [dailyStats, setDailyStats] = useState<DailyStats>({
//     moodScore: null,
//     completionRate: 100,
//     mindfulnessCount: 0,
//     totalActivities: 0,
//     lastUpdated: new Date(),
//   });

//   // fetch activities
//   const loadActivities = useCallback(async () => {
//     try {
//       const userActivities = await getUserActivities();
//       // normalize timestamps to Date
//       const normalized = userActivities.map((a: { timestamp: string | number | Date; createdAt: string | number | Date; updatedAt: string | number | Date; }) => ({
//         ...a,
//         timestamp: new Date(a.timestamp),
//         createdAt: new Date(a.createdAt),
//         updatedAt: new Date(a.updatedAt),
//       }));
//       setActivities(normalized);
//     } catch (err) {
//       console.error("Error loading activities:", err);
//     }
//   }, []);

//   // fetch stats
//   const fetchDailyStats = useCallback(async () => {
//     try {
//       setIsRefreshingStats(true);
//       const sessions = await getAllChatSessions();

//       const res = await fetch(`${API_BASE}/api/activity/today`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });

//       if (!res.ok) throw new Error("Failed to fetch today's activities");
//       const todayActivities: Activity[] = await res.json();

//       const moodEntries = todayActivities.filter(
//         (a) => a.type === "mood" && a.moodScore !== null
//       );

//       const averageMood =
//         moodEntries.length > 0
//           ? Math.round(
//               moodEntries.reduce(
//                 (sum, curr) => sum + (curr.moodScore || 0),
//                 0
//               ) / moodEntries.length
//             )
//           : null;

//       setDailyStats({
//         moodScore: averageMood,
//         completionRate: 100,
//         mindfulnessCount: sessions.length,
//         totalActivities: todayActivities.length,
//         lastUpdated: new Date(),
//       });
//     } catch (err) {
//       console.error("Error fetching stats:", err);
//     } finally {
//       setIsRefreshingStats(false);
//     }
//   }, []);

//   // effects
//   useEffect(() => {
//     setMounted(true);
//     const clock = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(clock);
//   }, []);

//   useEffect(() => {
//     loadActivities();
//   }, [loadActivities]);

//   useEffect(() => {
//     if (activities.length > 0) {
//       setDailyStats(calculateDailyStats(activities));
//       setInsights(generateInsights(activities));
//     }
//   }, [activities]);

//   useEffect(() => {
//     fetchDailyStats();
//     const i = setInterval(fetchDailyStats, 5 * 60 * 1000);
//     return () => clearInterval(i);
//   }, [fetchDailyStats]);

//   // derived UI tiles
//   const wellnessStats = useMemo(
//     () => [
//       {
//         title: "Mood Score",
//         value:
//           dailyStats.moodScore !== null ? `${dailyStats.moodScore}%` : "No data",
//         icon: Brain,
//         color: "text-purple-500",
//         bgColor: "bg-purple-500/10",
//         description: "Today's average mood",
//       },
//       {
//         title: "Completion Rate",
//         value: "100%",
//         icon: Trophy,
//         color: "text-yellow-500",
//         bgColor: "bg-yellow-500/10",
//         description: "Perfect completion rate",
//       },
//       {
//         title: "Therapy Sessions",
//         value: `${dailyStats.mindfulnessCount} sessions`,
//         icon: Heart,
//         color: "text-rose-500",
//         bgColor: "bg-rose-500/10",
//         description: "Total sessions completed",
//       },
//       {
//         title: "Total Activities",
//         value: dailyStats.totalActivities.toString(),
//         icon: ActivityIcon,
//         color: "text-blue-500",
//         bgColor: "bg-blue-500/10",
//         description: "Planned for today",
//       },
//     ],
//     [dailyStats]
//   );

//   if (!mounted) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background">
//       <Container className="pt-20 pb-8 space-y-6">
//         {/* Header */}
//         <div className="flex justify-between items-center">
//           <motion.div
//             initial={{ opacity: 0, x: -20 }}
//             animate={{ opacity: 1, x: 0 }}
//             className="space-y-2"
//           >
//             <h1 className="text-3xl font-bold text-foreground">
//               Welcome back, {user?.name || "there"}
//             </h1>
//             <p className="text-muted-foreground">
//               {currentTime.toLocaleDateString("en-US", {
//                 weekday: "long",
//                 month: "long",
//                 day: "numeric",
//               })}
//             </p>
//           </motion.div>
//           <Button variant="outline" size="icon" aria-label="Notifications">
//             <Bell className="h-5 w-5" />
//           </Button>
//         </div>

//         {/* Top Cards Grid */}
//         <div className="space-y-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

//             {/* Quick Actions */}
//             <Card className="border-primary/10 relative overflow-hidden">
//               <CardContent className="p-6 relative">
//                 <div className="space-y-6">
//                   <div className="flex items-center gap-3">
//                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
//                       <Sparkles className="w-5 h-5 text-primary" />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-lg">Quick Actions</h3>
//                       <p className="text-sm text-muted-foreground">
//                         Start your wellness journey
//                       </p>
//                     </div>
//                   </div>

//                   <Button
//                     className="w-full bg-primary text-white"
//                     onClick={() => (window.location.href = "/therapy/new")}
//                   >
//                     <MessageSquare className="mr-2" />
//                     Start Therapy
//                   </Button>

//                   <div className="grid grid-cols-2 gap-3">
//                     <Button
//                       variant="outline"
//                       onClick={() => setShowMoodModal(true)}
//                     >
//                       Track Mood
//                     </Button>

//                     <Button
//                       variant="outline"
//                       onClick={() => setShowActivityLogger(true)}
//                     >
//                       Check-in
//                     </Button>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Today's Overview */}
//             <Card className="border-primary/10">
//               <CardHeader>
//                 <div className="flex justify-between items-center">
//                   <div>
//                     <CardTitle>Today's Overview</CardTitle>
//                     <CardDescription>
//                       {format(new Date(), "MMMM d, yyyy")}
//                     </CardDescription>
//                   </div>
//                   <Button
//                     variant="ghost"
//                     size="icon"
//                     onClick={fetchDailyStats}
//                     aria-label="Refresh stats"
//                     disabled={isRefreshingStats}
//                   >
//                     <Loader2
//                       className={cn(
//                         "h-5 w-5",
//                         isRefreshingStats && "animate-spin"
//                       )}
//                     />
//                   </Button>
//                 </div>
//               </CardHeader>

//               <CardContent>
//                 <div className="grid grid-cols-2 gap-3">
//                   {wellnessStats.map((stat) => (
//                     <div
//                       key={stat.title}
//                       className={cn("p-4 rounded-lg", stat.bgColor)}
//                     >
//                       <div className="flex items-center gap-2">
//                         <stat.icon className={cn("h-5 w-5", stat.color)} />
//                         <p className="text-sm font-medium">{stat.title}</p>
//                       </div>
//                       <p className="text-2xl font-bold mt-1">{stat.value}</p>
//                       <p className="text-xs text-muted-foreground mt-1">
//                         {stat.description}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 <p className="mt-3 text-xs text-muted-foreground text-right">
//                   Last updated: {format(dailyStats.lastUpdated, "h:mm a")}
//                 </p>
//               </CardContent>
//             </Card>

//             {/* Insights */}
//             <Card className="border-primary/10">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <BrainCircuit className="w-5 h-5 text-primary" />
//                   Insights
//                 </CardTitle>
//                 <CardDescription>
//                   Personalized recommendations
//                 </CardDescription>
//               </CardHeader>

//               <CardContent>
//                 <div className="space-y-4">
//                   {insights.length > 0 ? (
//                     insights.map((insight, i) => (
//                       <div
//                         key={i}
//                         className={cn(
//                           "p-4 rounded-lg",
//                           insight.priority === "high"
//                             ? "bg-primary/10"
//                             : insight.priority === "medium"
//                             ? "bg-primary/5"
//                             : "bg-muted"
//                         )}
//                       >
//                         <insight.icon className="w-5 h-5 text-primary mb-2" />
//                         <p className="font-medium">{insight.title}</p>
//                         <p className="text-sm text-muted-foreground">
//                           {insight.description}
//                         </p>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="text-center text-muted-foreground py-8">
//                       <ActivityIcon className="w-8 h-8 mx-auto mb-3 opacity-50" />
//                       <p>Complete more activities to receive insights</p>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>

//           {/* ===== Inline Activities Timeline (Show/Hide) ===== */}
//           <Card className="border-primary/10">
//             <CardHeader className="flex flex-row items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <ListTree className="w-5 h-5 text-primary" />
//                 <CardTitle>My Activities (Timeline)</CardTitle>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Button
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setShowTimeline((s) => !s)}
//                   className="gap-1"
//                 >
//                   {showTimeline ? (
//                     <>
//                       Hide <ChevronUp className="w-4 h-4" />
//                     </>
//                   ) : (
//                     <>
//                       Show <ChevronDown className="w-4 h-4" />
//                     </>
//                   )}
//                 </Button>
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   onClick={() => setShowActivityLogger(true)}
//                 >
//                   + Log Activity
//                 </Button>
//               </div>
//             </CardHeader>

//             {showTimeline && (
//               <CardContent>
//                 {activities.length === 0 ? (
//                   <div className="text-sm text-muted-foreground py-6">
//                     No activities yet today. Click <b>Log Activity</b> to add one.
//                   </div>
//                 ) : (
//                   <div className="space-y-4">
//                     {activities
//                       .slice()
//                       .sort(
//                         (a, b) =>
//                           new Date(b.timestamp).getTime() -
//                           new Date(a.timestamp).getTime()
//                       )
//                       .map((a) => {
//                         const time = format(new Date(a.timestamp), "h:mm a");
//                         return (
//                           <div
//                             key={`${a.id}-${a.timestamp}`}
//                             className="relative pl-6"
//                           >
//                             <div className="absolute left-0 top-2">
//                               <Dot className="w-5 h-5 text-primary" />
//                             </div>
//                             <div className="flex flex-wrap items-center gap-2">
//                               <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
//                                 <Clock className="w-3.5 h-3.5" /> {time}
//                               </span>
//                               <span className="text-xs rounded-full px-2 py-0.5 bg-muted">
//                                 {a.type}
//                               </span>
//                               <span className="font-medium">{a.name}</span>
//                             </div>
//                             {a.description && (
//                               <p className="text-sm text-muted-foreground mt-1">
//                                 {a.description}
//                               </p>
//                             )}
//                           </div>
//                         );
//                       })}
//                   </div>
//                 )}
//               </CardContent>
//             )}
//           </Card>
//         </div>
//                 {/* ========= Main Content BELOW timeline ========= */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
//           {/* Left Content (Full width) */}
//           <div className="lg:col-span-3 space-y-6">
//             {/* ---------------- Anxiety Games --------------- */}
//             <AnxietyGames
//               onGamePlayed={async (name, desc) => {
//                 await logActivity({
//                   type: "game",
//                   name,
//                   description: desc,
//                 });
//                 loadActivities();
//               }}
//             />
//           </div>
//         </div>
//       </Container>

//       {/* ========= Modals ========= */}

//       {/* Mood Modal */}
//       <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>How are you feeling?</DialogTitle>
//             <DialogDescription>
//               Track your current emotional state
//             </DialogDescription>
//           </DialogHeader>

//           <MoodForm
//             onSuccess={() => {
//               setShowMoodModal(false);
//               loadActivities();
//               fetchDailyStats();
//             }}
//           />
//         </DialogContent>
//       </Dialog>

//       {/* Activity Logger Modal */}
//       <ActivityLogger
//         open={showActivityLogger}
//         onOpenChange={setShowActivityLogger}
//         onActivityLogged={() => {
//           loadActivities();
//           fetchDailyStats();
//         }}
//       />
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Activity as ActivityIcon,
  Heart,
  Trophy,
  Bell,
  Sparkles,
  BrainCircuit,
  Loader2,
  MessageSquare,
  ListTree,
  ChevronDown,
  ChevronUp,
  Clock,
  Dot,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { MoodForm } from "@/components/mood/mood-form";
import { AnxietyGames } from "@/components/games/anxiety-games";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { format } from "date-fns";
import { ActivityLogger } from "@/components/activities/activity-logger";
import { useSession } from "@/lib/contexts/session-context";
import { getAllChatSessions } from "@/lib/api/chat";
import { getUserActivities, logActivity } from "@/lib/api/activity";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://ai-agents-backend-2.onrender.com";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user } = useSession();

  const [insights, setInsights] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showActivityLogger, setShowActivityLogger] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [isRefreshingStats, setIsRefreshingStats] = useState(false);

  const [dailyStats, setDailyStats] = useState({
    moodScore: null as number | null,
    completionRate: 100,
    mindfulnessCount: 0,
    totalActivities: 0,
    lastUpdated: new Date(),
  });

  const loadActivities = useCallback(async () => {
    try {
      const userActivities = await getUserActivities();
      const normalized = userActivities.map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      }));
      setActivities(normalized);
    } catch (err) {
      console.error("Error loading activities:", err);
    }
  }, []);

  const fetchDailyStats = useCallback(async () => {
    try {
      setIsRefreshingStats(true);
      const sessions = await getAllChatSessions();
      const res = await fetch(`${API_BASE}/api/activity/today`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch today's activities");
      const todayActivities = await res.json();

      const moodEntries = todayActivities.filter(
        (a: any) => a.type === "mood" && a.moodScore !== null
      );

      const averageMood =
        moodEntries.length > 0
          ? Math.round(
              moodEntries.reduce(
                (sum: number, curr: any) => sum + (curr.moodScore || 0),
                0
              ) / moodEntries.length
            )
          : null;

      setDailyStats({
        moodScore: averageMood,
        completionRate: 100,
        mindfulnessCount: sessions.length,
        totalActivities: todayActivities.length,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setIsRefreshingStats(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const clock = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useEffect(() => {
    fetchDailyStats();
    const i = setInterval(fetchDailyStats, 5 * 60 * 1000);
    return () => clearInterval(i);
  }, [fetchDailyStats]);

  const wellnessStats = useMemo(
    () => [
      {
        title: "Mood Score",
        value:
          dailyStats.moodScore !== null ? `${dailyStats.moodScore}%` : "No data",
        icon: Brain,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        description: "Today's average mood",
      },
      {
        title: "Completion Rate",
        value: "100%",
        icon: Trophy,
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10",
        description: "Perfect completion rate",
      },
      {
        title: "Therapy Sessions",
        value: `${dailyStats.mindfulnessCount} sessions`,
        icon: Heart,
        color: "text-rose-500",
        bgColor: "bg-rose-500/10",
        description: "Sessions completed",
      },
      {
        title: "Total Activities",
        value: dailyStats.totalActivities.toString(),
        icon: ActivityIcon,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        description: "Planned today",
      },
    ],
    [dailyStats]
  );

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Container className="pt-20 pb-10 px-4 sm:px-6 space-y-6">
        {/* ===== Header ===== */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              👋 Welcome back,{" "}
              <span className="text-primary">{user?.name || "friend"}</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {currentTime.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
          </motion.div>

          <Button
            variant="outline"
            size="icon"
            aria-label="Notifications"
            className="sm:self-auto self-end"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>

        {/* ===== Top Cards ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Quick Actions */}
          <Card className="border-primary/10">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">
                    Start your wellness journey
                  </p>
                </div>
              </div>

              <Button
                className="w-full bg-primary text-white"
                onClick={() => (window.location.href = "/therapy/new")}
              >
                <MessageSquare className="mr-2 h-4 w-4" /> Start Therapy
              </Button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowMoodModal(true)}
                >
                  Track Mood
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowActivityLogger(true)}
                >
                  Check-in
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Today's Overview */}
          <Card className="border-primary/10">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Today's Overview</CardTitle>
                  <CardDescription>
                    {format(new Date(), "MMMM d, yyyy")}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchDailyStats}
                  disabled={isRefreshingStats}
                >
                  <Loader2
                    className={cn("h-5 w-5", isRefreshingStats && "animate-spin")}
                  />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {wellnessStats.map((stat) => (
                  <div
                    key={stat.title}
                    className={cn("p-3 sm:p-4 rounded-lg", stat.bgColor)}
                  >
                    <div className="flex items-center gap-2">
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                      <p className="text-sm font-medium">{stat.title}</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-primary" />
                Insights
              </CardTitle>
              <CardDescription>Personalized tips for you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.length > 0 ? (
                  insights.map((insight, i) => (
                    <div
                      key={i}
                      className={cn(
                        "p-3 rounded-lg",
                        insight.priority === "high"
                          ? "bg-primary/10"
                          : "bg-muted"
                      )}
                    >
                      <insight.icon className="w-5 h-5 text-primary mb-2" />
                      <p className="font-medium text-sm sm:text-base">
                        {insight.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete more activities to get insights.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== Timeline Section ===== */}
        <Card className="border-primary/10">
          <CardHeader className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex items-center gap-2">
              <ListTree className="w-5 h-5 text-primary" />
              <CardTitle>My Activities (Timeline)</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTimeline((s) => !s)}
                className="gap-1"
              >
                {showTimeline ? (
                  <>
                    Hide <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Show <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowActivityLogger(true)}
              >
                + Log Activity
              </Button>
            </div>
          </CardHeader>

          {showTimeline && (
            <CardContent className="overflow-x-auto max-h-[400px] sm:max-h-none">
              {activities.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6">
                  No activities yet today. Click <b>Log Activity</b> to add one.
                </div>
              ) : (
                <div className="space-y-4 min-w-[300px] sm:min-w-0">
                  {activities
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((a) => {
                      const time = format(new Date(a.timestamp), "h:mm a");
                      return (
                        <div
                          key={`${a.id}-${a.timestamp}`}
                          className="relative pl-6"
                        >
                          <div className="absolute left-0 top-2">
                            <Dot className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {time}
                            </span>
                            <span className="text-xs rounded-full px-2 py-0.5 bg-muted">
                              {a.type}
                            </span>
                            <span className="font-medium">{a.name}</span>
                          </div>
                          {a.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {a.description}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* ===== Games Section ===== */}
        <div className="mt-6">
          <AnxietyGames
            onGamePlayed={async (name, desc) => {
              await logActivity({ type: "game", name, description: desc });
              loadActivities();
            }}
          />
        </div>
      </Container>

      {/* ===== Modals ===== */}
      <Dialog open={showMoodModal} onOpenChange={setShowMoodModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How are you feeling?</DialogTitle>
            <DialogDescription>
              Track your current emotional state
            </DialogDescription>
          </DialogHeader>

          <MoodForm
            onSuccess={() => {
              setShowMoodModal(false);
              loadActivities();
              fetchDailyStats();
            }}
          />
        </DialogContent>
      </Dialog>

      <ActivityLogger
        open={showActivityLogger}
        onOpenChange={setShowActivityLogger}
        onActivityLogged={() => {
          loadActivities();
          fetchDailyStats();
        }}
      />
    </div>
  );
}
