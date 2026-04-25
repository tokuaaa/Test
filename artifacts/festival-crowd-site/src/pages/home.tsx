import { useListFestivalGroups, getListFestivalGroupsQueryKey, useGetFestivalSummary, getGetFestivalSummaryQueryKey } from "@workspace/api-client-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, MapPin, Search, Filter, AlertCircle, Info, RefreshCw, Navigation, Crosshair, Wifi, Calendar, Sparkles, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type MapPoint = {
  room: string;
  display: string;
  floor: string;
  x: number;
  y: number;
  aliases: string[];
};

type VisitorPosition = {
  lat: number;
  lng: number;
  accuracy: number;
  updatedAt: number;
};

const mapPoints: MapPoint[] = [
  { room: "中1A", display: "中1学年参加", floor: "中学棟3階", x: 12, y: 25, aliases: ["中1A", "中１A", "中1学年参加"] },
  { room: "中1B", display: "中1学年参加", floor: "中学棟3階", x: 22, y: 25, aliases: ["中1B", "中１B", "中1学年参加"] },
  { room: "中1C", display: "Debating Union", floor: "中学棟3階", x: 32, y: 25, aliases: ["中1C", "中１C", "Debating Union"] },
  { room: "中1D", display: "KCC", floor: "中学棟3階", x: 53, y: 12, aliases: ["中1D", "中１D", "KCC"] },
  { room: "中1E", display: "KCC", floor: "中学棟3階", x: 67, y: 12, aliases: ["中1E", "中１E", "KCC"] },
  { room: "中1F", display: "LASER TAG", floor: "中学棟3階", x: 82, y: 12, aliases: ["中1F", "中１F", "LASER TAG"] },
  { room: "中2A", display: "レトロ喫茶まさる", floor: "中学棟4階", x: 12, y: 35, aliases: ["中2A", "中２A", "レトロ喫茶", "まさる"] },
  { room: "中2B", display: "レトロ喫茶まさる", floor: "中学棟4階", x: 24, y: 35, aliases: ["中2B", "中２B", "レトロ喫茶", "まさる"] },
  { room: "中2C", display: "夏展", floor: "中学棟4階", x: 36, y: 35, aliases: ["中2C", "中２C", "夏展"] },
  { room: "中2D", display: "中2学年参加", floor: "中学棟4階", x: 55, y: 18, aliases: ["中2D", "中２D", "中2学年参加"] },
  { room: "中2E", display: "神兵衛", floor: "中学棟4階", x: 69, y: 18, aliases: ["中2E", "中２E", "神兵衛"] },
  { room: "中2F", display: "神兵衛", floor: "中学棟4階", x: 83, y: 18, aliases: ["中2F", "中２F", "神兵衛"] },
  { room: "中3A", display: "浅野小学校", floor: "中学棟5階", x: 12, y: 35, aliases: ["中3A", "中３A", "浅野小学校"] },
  { room: "中3B", display: "浅野小学校", floor: "中学棟5階", x: 24, y: 35, aliases: ["中3B", "中３B", "浅野小学校"] },
  { room: "中3C", display: "ASET(特撮)", floor: "中学棟5階", x: 36, y: 35, aliases: ["中3C", "中３C", "ASET", "特撮"] },
  { room: "中3D", display: "折り紙研究会", floor: "中学棟5階", x: 55, y: 18, aliases: ["中3D", "中３D", "折り紙研究会"] },
  { room: "中3E", display: "書道部", floor: "中学棟5階", x: 69, y: 18, aliases: ["中3E", "中３E", "書道部"] },
  { room: "中3F", display: "書道部", floor: "中学棟5階", x: 83, y: 18, aliases: ["中3F", "中３F", "書道部"] },
  { room: "高一A", display: "生徒会", floor: "高校棟3階", x: 12, y: 42, aliases: ["高一A", "高1A", "生徒会"] },
  { room: "高一B", display: "数学同好会", floor: "高校棟3階", x: 24, y: 42, aliases: ["高一B", "高1B", "数学同好会"] },
  { room: "高一C", display: "化学部", floor: "高校棟3階", x: 42, y: 62, aliases: ["高一C", "高1C", "化学部"] },
  { room: "高一D", display: "お化け屋敷", floor: "高校棟3階", x: 56, y: 62, aliases: ["高一D", "高1D", "お化け屋敷"] },
  { room: "高一E", display: "お化け屋敷", floor: "高校棟3階", x: 70, y: 62, aliases: ["高一E", "高1E", "お化け屋敷"] },
  { room: "高一F", display: "お化け屋敷", floor: "高校棟3階", x: 84, y: 62, aliases: ["高一F", "高1F", "お化け屋敷"] },
  { room: "選択教室1", display: "化学部", floor: "高校棟3階", x: 44, y: 25, aliases: ["選択教室1", "選択教室１", "化学部"] },
  { room: "選択教室2", display: "化学部", floor: "高校棟3階", x: 62, y: 25, aliases: ["選択教室2", "選択教室２", "化学部"] },
  { room: "高二A", display: "地学部", floor: "高校棟4階", x: 12, y: 42, aliases: ["高二A", "高2A", "地学部"] },
  { room: "高二B", display: "地学部", floor: "高校棟4階", x: 24, y: 42, aliases: ["高二B", "高2B", "地学部"] },
  { room: "高二C", display: "アサノ大全", floor: "高校棟4階", x: 42, y: 62, aliases: ["高二C", "高2C", "アサノ大全"] },
  { room: "高二D", display: "カードゲーム同好会", floor: "高校棟4階", x: 56, y: 62, aliases: ["高二D", "高2D", "カードゲーム同好会"] },
  { room: "高二E", display: "BARミヤン", floor: "高校棟4階", x: 70, y: 62, aliases: ["高二E", "高2E", "BARミヤン"] },
  { room: "高二F", display: "BARミヤン", floor: "高校棟4階", x: 84, y: 62, aliases: ["高二F", "高2F", "BARミヤン"] },
  { room: "選択教室3", display: "地学部プラネタリウム", floor: "高校棟4階", x: 44, y: 25, aliases: ["選択教室3", "選択教室３", "プラネタリウム", "地学部"] },
  { room: "選択教室4", display: "棋道部", floor: "高校棟4階", x: 62, y: 25, aliases: ["選択教室4", "選択教室４", "棋道部"] },
  { room: "高三A", display: "歴史研究部", floor: "高校棟5階", x: 12, y: 42, aliases: ["高三A", "高3A", "歴史研究部"] },
  { room: "高三B", display: "歴史研究部", floor: "高校棟5階", x: 24, y: 42, aliases: ["高三B", "高3B", "歴史研究部"] },
  { room: "高三C", display: "鉄道研究部", floor: "高校棟5階", x: 42, y: 62, aliases: ["高三C", "高3C", "鉄道研究部"] },
  { room: "高三D", display: "鉄道研究部", floor: "高校棟5階", x: 56, y: 62, aliases: ["高三D", "高3D", "鉄道研究部"] },
  { room: "高三E", display: "りすのおうち", floor: "高校棟5階", x: 70, y: 62, aliases: ["高三E", "高3E", "りすのおうち"] },
  { room: "高三F", display: "りすのおうち", floor: "高校棟5階", x: 84, y: 62, aliases: ["高三F", "高3F", "りすのおうち"] },
  { room: "高三G", display: "登山部", floor: "高校棟5階", x: 66, y: 25, aliases: ["高三G", "高3G", "登山部"] },
  { room: "高三H", display: "鉄道研究部", floor: "高校棟5階", x: 52, y: 25, aliases: ["高三H", "高3H", "鉄道研究部"] },
  { room: "社会科教室", display: "物理部展", floor: "その他", x: 14, y: 20, aliases: ["社会科教室", "物理部展", "物理部"] },
  { room: "ICT教室", display: "クイズ研究部", floor: "その他", x: 35, y: 48, aliases: ["ICT教室", "クイズ研究部"] },
  { room: "中学会議室", display: "PTA厚生部バザー", floor: "その他", x: 63, y: 72, aliases: ["中学会議室", "PTA厚生部バザー", "PTA"] },
  { room: "演習教室1", display: "賛助会", floor: "その他", x: 82, y: 22, aliases: ["演習教室1", "演習教室１", "賛助会"] },
  { room: "演習教室2", display: "同窓会", floor: "その他", x: 68, y: 22, aliases: ["演習教室2", "演習教室２", "同窓会"] },
];

const floors = [
  "すべて",
  "中学棟1階",
  "中学棟2階",
  "中学棟3階",
  "中学棟4階",
  "中学棟5階",
  "高校棟1階",
  "高校棟2階",
  "高校棟3階",
  "高校棟4階",
  "高校棟5階",
  "ハンドボールコート",
  "打越アリーナ",
  "校庭",
  "その他",
];

type Building3D = {
  id: string;
  name: string;
  baseX: number;
  baseY: number;
  width: number;
  depth: number;
  floors: { name: string; label: string; sub: string; level: number }[];
  accent: string;
  edge: string;
};

const buildings3D: Building3D[] = [
  {
    id: "junior",
    name: "中学棟",
    baseX: 6,
    baseY: 30,
    width: 38,
    depth: 28,
    accent: "from-rose-200/95 to-rose-100/90",
    edge: "border-rose-400",
    floors: [
      { name: "中学棟1階", label: "1F", sub: "", level: 0 },
      { name: "中学棟2階", label: "2F", sub: "", level: 1 },
      { name: "中学棟3階", label: "3F", sub: "中1", level: 2 },
      { name: "中学棟4階", label: "4F", sub: "中2", level: 3 },
      { name: "中学棟5階", label: "5F", sub: "中3", level: 4 },
    ],
  },
  {
    id: "senior",
    name: "高校棟",
    baseX: 54,
    baseY: 30,
    width: 38,
    depth: 28,
    accent: "from-amber-200/95 to-amber-100/90",
    edge: "border-amber-400",
    floors: [
      { name: "高校棟1階", label: "1F", sub: "", level: 0 },
      { name: "高校棟2階", label: "2F", sub: "", level: 1 },
      { name: "高校棟3階", label: "3F", sub: "高1", level: 2 },
      { name: "高校棟4階", label: "4F", sub: "高2", level: 3 },
      { name: "高校棟5階", label: "5F", sub: "高3", level: 4 },
    ],
  },
];

type ScheduleVenue = "中学棟" | "高校棟" | "校庭" | "打越アリーナ" | "その他";

type ScheduleEvent = {
  id: string;
  title: string;
  venue: ScheduleVenue;
  startMinutes: number;
  endMinutes: number;
};

const scheduleVenues: ScheduleVenue[] = ["中学棟", "高校棟", "校庭", "打越アリーナ", "その他"];

const SCHEDULE_START_HOUR = 9;
const SCHEDULE_END_HOUR = 17;

const scheduleSlots = Array.from(
  { length: (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 2 },
  (_, i) => {
    const minutes = SCHEDULE_START_HOUR * 60 + i * 30;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return {
      label: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      startMinutes: i * 30,
    };
  },
);

const scheduleEvents: ScheduleEvent[] = [
  {
    id: "quiz",
    title: "クイズ大会",
    venue: "打越アリーナ",
    startMinutes: (10 - SCHEDULE_START_HOUR) * 60,
    endMinutes: (15 - SCHEDULE_START_HOUR) * 60,
  },
];

const waitColorMap: Record<string, { dot: string; ring: string; label: string }> = {
  "待ちなし": { dot: "bg-emerald-500", ring: "ring-emerald-400", label: "空き" },
  "空きあり": { dot: "bg-emerald-500", ring: "ring-emerald-400", label: "空き" },
  "少し混雑": { dot: "bg-amber-500", ring: "ring-amber-400", label: "やや" },
  "10-20分待ち": { dot: "bg-amber-500", ring: "ring-amber-400", label: "10-20" },
  "混雑": { dot: "bg-rose-600", ring: "ring-rose-500", label: "混雑" },
  "30分以上待ち": { dot: "bg-rose-600", ring: "ring-rose-500", label: "30+" },
  "整理券配布終了": { dot: "bg-rose-600", ring: "ring-rose-500", label: "終" },
  "受付終了": { dot: "bg-slate-400", ring: "ring-slate-300", label: "終" },
  "準備中": { dot: "bg-slate-400", ring: "ring-slate-300", label: "準" },
  "休止中": { dot: "bg-slate-400", ring: "ring-slate-300", label: "休" },
};

function getWaitVisual(wait?: string) {
  if (!wait) return { dot: "bg-slate-300", ring: "ring-slate-200", label: "?" };
  return waitColorMap[wait] ?? { dot: "bg-primary", ring: "ring-primary/40", label: "?" };
}

function isEmptyWait(wait?: string) {
  return wait === "待ちなし" || wait === "空きあり";
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s/g, "").replace(/[１-９Ａ-Ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
}

function findMapPoint(group: { name: string; location: string }) {
  const target = normalizeText(`${group.name} ${group.location}`);
  return mapPoints.find((point) =>
    [point.room, point.display, point.floor, ...point.aliases].some((alias) => {
      const normalized = normalizeText(alias);
      return normalized.length > 1 && target.includes(normalized);
    }),
  );
}

export default function Home() {
  const { data: groupsPayload, isLoading: isLoadingGroups, refetch: refetchGroups, isFetching: isFetchingGroups } = useListFestivalGroups({
    query: { queryKey: getListFestivalGroupsQueryKey() }
  });

  const { data: summary, isLoading: isLoadingSummary } = useGetFestivalSummary({
    query: { queryKey: getGetFestivalSummaryQueryKey() }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [waitFilter, setWaitFilter] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState("中学棟3階");
  const [visitorPosition, setVisitorPosition] = useState<VisitorPosition | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [locationError, setLocationError] = useState("");
  const [showSplash, setShowSplash] = useState(true);
  const [networkInfo, setNetworkInfo] = useState<{
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    type?: string;
    updatedAt: number;
  } | null>(null);
  const [now, setNow] = useState<Date>(new Date());
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("festival-favorites");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem("festival-favorites", JSON.stringify(favorites));
    } catch {
      // ignore quota / private mode errors
    }
  }, [favorites]);

  const favoriteKey = useCallback((g: { name: string; location: string }) => `${g.name}__${g.location}`, []);

  const toggleFavorite = useCallback(
    (g: { name: string; location: string }) => {
      const key = favoriteKey(g);
      setFavorites((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    },
    [favoriteKey],
  );

  const sampleNetworkInfo = useCallback(() => {
    const conn = (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        type?: string;
      };
    }).connection;
    setNetworkInfo({
      online: navigator.onLine,
      effectiveType: conn?.effectiveType,
      downlink: conn?.downlink,
      rtt: conn?.rtt,
      type: conn?.type,
      updatedAt: Date.now(),
    });
  }, []);

  useEffect(() => {
    sampleNetworkInfo();
    const onChange = () => sampleNetworkInfo();
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    const conn = (navigator as Navigator & {
      connection?: { addEventListener?: (t: string, l: () => void) => void; removeEventListener?: (t: string, l: () => void) => void };
    }).connection;
    conn?.addEventListener?.("change", onChange);
    return () => {
      window.removeEventListener("online", onChange);
      window.removeEventListener("offline", onChange);
      conn?.removeEventListener?.("change", onChange);
    };
  }, [sampleNetworkInfo]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const requestVisitorPosition = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("error");
      setLocationError("この端末では位置情報を取得できません。");
      return;
    }

    setLocationStatus("loading");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVisitorPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: Date.now(),
        });
        setLocationStatus("ready");
      },
      (error) => {
        setLocationStatus("error");
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("位置情報の許可がありません。ブラウザの設定から許可してください。");
        } else if (error.code === error.TIMEOUT) {
          setLocationError("位置情報の取得がタイムアウトしました。もう一度お試しください。");
        } else {
          setLocationError("位置情報を取得できませんでした。");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );
  }, []);

  useEffect(() => {
    requestVisitorPosition();
  }, [requestVisitorPosition]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowSplash(false);
    }, 1700);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredGroups = useMemo(() => {
    if (!groupsPayload?.groups) return [];
    
    let filtered = groupsPayload.groups;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(q) || 
        g.desc.toLowerCase().includes(q) || 
        g.location.toLowerCase().includes(q)
      );
    }
    
    if (waitFilter !== "all") {
      filtered = filtered.filter(g => g.wait === waitFilter);
    }
    
    return filtered;
  }, [groupsPayload?.groups, searchQuery, waitFilter]);

  const favoriteGroups = useMemo(() => {
    if (!groupsPayload?.groups || favorites.length === 0) return [];
    const set = new Set(favorites);
    return groupsPayload.groups.filter((g) => set.has(`${g.name}__${g.location}`));
  }, [groupsPayload?.groups, favorites]);

  const getWaitBadgeColor = (wait: string) => {
    switch (wait) {
      case "待ちなし":
      case "空きあり":
        return "bg-green-500 hover:bg-green-600 text-white border-transparent";
      case "少し混雑":
      case "10-20分待ち":
        return "bg-yellow-500 hover:bg-yellow-600 text-white border-transparent";
      case "混雑":
      case "30分以上待ち":
      case "整理券配布終了":
        return "bg-red-500 hover:bg-red-600 text-white border-transparent";
      case "受付終了":
      case "準備中":
      case "休止中":
        return "bg-gray-500 hover:bg-gray-600 text-white border-transparent";
      default:
        return "bg-primary hover:bg-primary/90 text-white border-transparent";
    }
  };

  const visibleMapGroups = useMemo(() => {
    return filteredGroups
      .map((group) => ({ group, point: findMapPoint(group) }))
      .filter((item): item is { group: typeof filteredGroups[number]; point: MapPoint } => Boolean(item.point))
      .filter((item) => selectedFloor === "すべて" || item.point.floor === selectedFloor);
  }, [filteredGroups, selectedFloor]);

  const visibleReferencePoints = useMemo(() => {
    return mapPoints.filter((point) => selectedFloor === "すべて" || point.floor === selectedFloor);
  }, [selectedFloor]);

  const allMappedGroups = useMemo(() => {
    if (!groupsPayload?.groups) return [] as { group: { name: string; wait?: string; location: string; desc: string }; point: MapPoint }[];
    return groupsPayload.groups
      .map((group) => ({ group, point: findMapPoint(group) }))
      .filter((item): item is { group: typeof groupsPayload.groups[number]; point: MapPoint } => Boolean(item.point));
  }, [groupsPayload?.groups]);

  const emptyOnSelectedFloor = useMemo(() => {
    if (selectedFloor === "すべて") return [];
    return allMappedGroups.filter((item) => item.point.floor === selectedFloor && isEmptyWait(item.group.wait));
  }, [allMappedGroups, selectedFloor]);

  const nowMinutes = (now.getHours() - SCHEDULE_START_HOUR) * 60 + now.getMinutes();

  const activeEvents = useMemo(() => {
    return scheduleEvents.filter((ev) => nowMinutes >= ev.startMinutes && nowMinutes < ev.endMinutes);
  }, [nowMinutes]);

  const handleRefresh = () => {
    refetchGroups();
    requestVisitorPosition();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
      {showSplash && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[radial-gradient(circle_at_center,_hsl(40_90%_60%)_0%,_hsl(354_82%_56%)_45%,_hsl(220_50%_15%)_100%)]">
          <div className="text-center text-white animate-in fade-in zoom-in-95 duration-500">
            <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-white/30 bg-white/15 shadow-2xl backdrop-blur-md">
              <span className="text-4xl font-black tracking-tight">47th</span>
            </div>
            <p className="text-sm font-semibold tracking-[0.35em] text-white/80">SCHOOL FESTIVAL</p>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              祭
            </div>
            <h1 className="font-bold text-lg tracking-tight text-foreground">学園祭リアルタイム混雑状況</h1>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={isFetchingGroups || locationStatus === "loading"}
          >
            <RefreshCw className={`h-5 w-5 ${isFetchingGroups || locationStatus === "loading" ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 max-w-5xl space-y-8">
        {/* Dashboard Summary */}
        <section>
          {isLoadingSummary ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : summary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <p className="text-sm text-muted-foreground font-medium mb-1">参加団体</p>
                  <p className="text-3xl font-bold text-primary">{summary.totalGroups}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-none shadow-sm">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <p className="text-sm text-muted-foreground font-medium mb-1">更新済</p>
                  <p className="text-3xl font-bold text-green-600">{summary.updatedGroups}</p>
                </CardContent>
              </Card>
              {summary.waitCounts.slice(0, 2).map((wc) => (
                <Card key={wc.label} className="bg-card border-none shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                    <p className="text-sm text-muted-foreground font-medium mb-1">{wc.label}</p>
                    <p className="text-3xl font-bold text-foreground">{wc.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : null}
        </section>

        {/* Favorites */}
        {favoriteGroups.length > 0 && (
          <section className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2 text-amber-900">
                <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                お気に入り（{favoriteGroups.length}）
              </h2>
              <p className="text-xs text-amber-800">★を押すと追加・解除できます</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {favoriteGroups.map((g) => (
                <div
                  key={`fav-${g.name}-${g.location}`}
                  className="bg-white border border-amber-200 rounded-xl p-3 flex items-start gap-3 hover:shadow-sm transition"
                >
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleFavorite(g)}
                    className="h-7 w-7 shrink-0 text-amber-500 hover:text-amber-600 hover:bg-amber-100"
                    aria-label="お気に入りから外す"
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm leading-tight truncate">{g.name}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{g.location}</span>
                    </p>
                    <Badge className={`mt-1.5 text-[10px] px-2 py-0 h-5 font-medium ${getWaitBadgeColor(g.wait)}`}>
                      {g.wait || "状況不明"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="bg-card p-4 rounded-xl shadow-sm border space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="団体名や場所で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={waitFilter} onValueChange={setWaitFilter}>
                <SelectTrigger className="bg-background">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="混雑状況" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて表示</SelectItem>
                  {summary?.waitCounts.map(wc => (
                    <SelectItem key={wc.label} value={wc.label}>{wc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-muted/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                校内マップ
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                PDFの教室情報をもとに団体の位置を表示します。ページ表示時と更新時に現在地の座標も取得します。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                <SelectTrigger className="bg-background sm:w-40">
                  <SelectValue placeholder="階を選択" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor}>{floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={requestVisitorPosition} disabled={locationStatus === "loading"} className="gap-2">
                <Crosshair className={`h-4 w-4 ${locationStatus === "loading" ? "animate-pulse" : ""}`} />
                現在地を更新
              </Button>
            </div>
          </div>

          <div className="p-5 grid lg:grid-cols-[1fr_280px] gap-5">
            {selectedFloor === "すべて" ? (
              <div className="relative h-[520px] rounded-xl border bg-gradient-to-br from-sky-50 via-white to-amber-50 overflow-hidden">
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ perspective: "1600px" }}
                >
                  <div
                    className="relative"
                    style={{
                      transformStyle: "preserve-3d",
                      transform: "rotateX(58deg) rotateZ(-28deg)",
                      width: "78%",
                      height: "78%",
                    }}
                  >
                    {/* Ground / その他 base */}
                    <div
                      className="absolute rounded-2xl border-2 border-slate-300 bg-gradient-to-br from-slate-100 to-slate-50 shadow-lg"
                      style={{
                        left: "20%",
                        top: "62%",
                        width: "60%",
                        height: "26%",
                        transform: "translateZ(-4px)",
                      }}
                    >
                      <div className="absolute left-2 top-1.5 text-[10px] font-bold text-slate-500" style={{ transform: "rotateZ(28deg) rotateX(-58deg)" }}>その他</div>
                      {mapPoints.filter((p) => p.floor === "その他").map((point) => {
                        const matched = allMappedGroups.find((item) => item.point.room === point.room);
                        const visual = getWaitVisual(matched?.group.wait);
                        return (
                          <div
                            key={`base-${point.room}`}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[8px] font-semibold shadow flex items-center gap-1 ${
                              matched ? "bg-white text-slate-800 ring-2 " + visual.ring : "bg-white/90 text-slate-600 border border-slate-300"
                            }`}
                            style={{
                              left: `${point.x}%`,
                              top: `${point.y}%`,
                              transform: `translate(-50%, -50%) rotateZ(28deg) rotateX(-58deg)`,
                            }}
                            title={`${point.room} ${point.display}${matched?.group.wait ? " - " + matched.group.wait : ""}`}
                          >
                            {matched && <span className={`inline-block w-1.5 h-1.5 rounded-full ${visual.dot}`} />}
                            {point.room}
                          </div>
                        );
                      })}
                    </div>

                    {buildings3D.map((building) => (
                      <div key={building.id}>
                        {building.floors.map((floor) => {
                          const floorPoints = mapPoints.filter((p) => p.floor === floor.name);
                          const isEmpty = floorPoints.length === 0;
                          return (
                            <div
                              key={floor.name}
                              className={`absolute rounded-2xl border-2 ${building.edge} bg-gradient-to-br ${building.accent} shadow-2xl ${isEmpty ? "opacity-60" : ""}`}
                              style={{
                                left: `${building.baseX}%`,
                                top: `${building.baseY}%`,
                                width: `${building.width}%`,
                                height: `${building.depth}%`,
                                transform: `translateZ(${(floor.level + 1) * 60}px)`,
                              }}
                            >
                              <div
                                className="absolute -top-1 left-2 rounded-md bg-slate-900/85 text-white text-[10px] font-bold px-1.5 py-0.5 shadow"
                                style={{ transform: "rotateZ(28deg) rotateX(-58deg)" }}
                              >
                                {building.name} {floor.label}{floor.sub ? `・${floor.sub}` : ""}
                              </div>
                              {isEmpty && (
                                <div
                                  className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-500 font-medium"
                                  style={{ transform: "rotateZ(28deg) rotateX(-58deg)" }}
                                >
                                  準備中
                                </div>
                              )}
                              {floorPoints.map((point) => {
                                const matched = allMappedGroups.find((item) => item.point.room === point.room);
                                const visual = getWaitVisual(matched?.group.wait);
                                return (
                                  <div
                                    key={`${floor.name}-${point.room}`}
                                    className={`absolute rounded-md px-1.5 py-0.5 text-[8px] font-semibold shadow whitespace-nowrap flex items-center gap-1 ${
                                      matched ? "bg-white text-slate-800 ring-2 " + visual.ring : "bg-white/95 text-slate-700 border border-white"
                                    }`}
                                    style={{
                                      left: `${point.x}%`,
                                      top: `${point.y}%`,
                                      transform: `translate(-50%, -50%) rotateZ(28deg) rotateX(-58deg)`,
                                    }}
                                    title={`${point.room} ${point.display}${matched?.group.wait ? " - " + matched.group.wait : ""}`}
                                  >
                                    {matched && <span className={`inline-block w-1.5 h-1.5 rounded-full ${visual.dot}`} />}
                                    {point.room}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute left-4 top-4 rounded-lg bg-white/95 border px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                  3D 校舎ビュー
                </div>
                <div className="absolute right-4 top-4 rounded-lg bg-white/90 border px-2.5 py-1 text-[10px] text-slate-600 shadow-sm space-y-0.5">
                  <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded bg-rose-300 border border-rose-400" />中学棟 (3〜5F)</div>
                  <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded bg-amber-300 border border-amber-400" />高校棟 (3〜5F)</div>
                  <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded bg-slate-200 border border-slate-400" />本館</div>
                </div>
                <div className="absolute left-4 bottom-4 rounded-full bg-white/95 border px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                  表示中: {visibleMapGroups.length}団体 / 階層を選ぶと平面図に切り替わります
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {emptyOnSelectedFloor.length > 0 && (
                  <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 px-4 py-3 flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold text-emerald-800">この階に空いている団体があります！</p>
                      <p className="text-emerald-700 mt-0.5">
                        {emptyOnSelectedFloor.map((item) => `${item.point.room} ${item.group.name}`).join(" / ")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="relative h-[420px] rounded-xl border bg-gradient-to-br from-amber-50 via-white to-rose-50 overflow-hidden">
                  <div className="absolute inset-x-8 top-1/2 h-12 -translate-y-1/2 rounded-full bg-slate-200/70 border border-slate-300" />
                  <div className="absolute left-1/2 inset-y-8 w-12 -translate-x-1/2 rounded-full bg-slate-200/70 border border-slate-300" />
                  <div className="absolute left-4 top-4 rounded-lg bg-white/95 border px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                    {selectedFloor} の平面図
                  </div>
                  <div className="absolute right-4 top-4 rounded-lg bg-white/90 border px-2.5 py-1.5 text-[10px] text-slate-600 shadow-sm space-y-0.5">
                    <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />空き</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" />少し</div>
                    <div className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-600" />混雑</div>
                  </div>
                  {visibleReferencePoints.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                      この階のマップ情報はまだ準備中です
                    </div>
                  )}
                  {visibleReferencePoints.map((point) => {
                    const matched = allMappedGroups.find((item) => item.point.room === point.room || item.point.display === point.display);
                    const visual = getWaitVisual(matched?.group.wait);
                    return (
                      <div
                        key={`${point.floor}-${point.room}-${point.x}-${point.y}`}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 px-2.5 py-2 text-[11px] leading-tight shadow-sm transition-all hover:scale-105 bg-white ${
                          matched ? "border-transparent ring-2 z-20 " + visual.ring : "border-slate-200 z-10"
                        }`}
                        style={{ left: `${point.x}%`, top: `${point.y}%` }}
                        title={`${point.floor} ${point.room} ${point.display}${matched?.group.wait ? " - " + matched.group.wait : ""}`}
                      >
                        <div className="flex items-center gap-1">
                          {matched && <span className={`inline-block w-2.5 h-2.5 rounded-full ${visual.dot}`} />}
                          <div className="font-bold whitespace-nowrap">{point.room}</div>
                        </div>
                        <div className="max-w-24 truncate opacity-90 text-slate-600">{matched?.group.name ?? point.display}</div>
                        {matched?.group.wait && (
                          <div className={`mt-0.5 inline-block rounded px-1 text-[9px] text-white font-bold ${visual.dot}`}>
                            {matched.group.wait}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div className="absolute left-4 bottom-4 rounded-full bg-white/90 border px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                    表示中: {visibleMapGroups.length}団体 / 基準点 {visibleReferencePoints.length}件
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    来場者の取得座標
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {locationStatus === "loading" && <p className="text-muted-foreground">位置情報を取得中です。</p>}
                  {visitorPosition && (
                    <div className="space-y-1">
                      <p>緯度: <span className="font-mono">{visitorPosition.lat.toFixed(6)}</span></p>
                      <p>経度: <span className="font-mono">{visitorPosition.lng.toFixed(6)}</span></p>
                      <p>精度: 約{Math.round(visitorPosition.accuracy)}m</p>
                      <p className="text-xs text-muted-foreground">
                        取得時刻: {new Date(visitorPosition.updatedAt).toLocaleTimeString("ja-JP")}
                      </p>
                    </div>
                  )}
                  {locationStatus === "error" && (
                    <p className="text-destructive leading-relaxed">{locationError}</p>
                  )}
                  {locationStatus === "idle" && <p className="text-muted-foreground">位置情報はまだ取得していません。</p>}
                </CardContent>
              </Card>

              <Card className="border-sky-300/40 bg-sky-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-sky-600" />
                    Wi-Fi / ネットワーク
                  </CardTitle>
                  <CardDescription className="text-[11px] leading-snug">
                    ブラウザはWi-Fi電波を直接読めないため、回線種別と速度から強度を推定します。位置情報も内部でWi-Fiを使っています。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm">
                  {networkInfo ? (
                    <>
                      <p>状態: <span className={`font-semibold ${networkInfo.online ? "text-emerald-600" : "text-rose-600"}`}>{networkInfo.online ? "オンライン" : "オフライン"}</span></p>
                      <p>回線種別: <span className="font-mono">{networkInfo.type ?? networkInfo.effectiveType ?? "不明"}</span></p>
                      {typeof networkInfo.downlink === "number" && (
                        <p>速度: <span className="font-mono">{networkInfo.downlink.toFixed(1)} Mbps</span></p>
                      )}
                      {typeof networkInfo.rtt === "number" && (
                        <p>応答時間: <span className="font-mono">{networkInfo.rtt} ms</span></p>
                      )}
                      <div className="pt-1">
                        <p className="text-[11px] text-sky-700 font-semibold">
                          {(() => {
                            const eff = networkInfo.effectiveType;
                            if (!networkInfo.online) return "接続なし";
                            if (eff === "4g") return "電波: 強い (建物内推定OK)";
                            if (eff === "3g") return "電波: 中くらい";
                            if (eff === "2g" || eff === "slow-2g") return "電波: 弱い";
                            return "電波: 計測できません";
                          })()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={sampleNetworkInfo} className="mt-2 h-7 text-xs gap-1">
                        <RefreshCw className="h-3 w-3" /> 再測定
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-xs">この端末では取得できません。</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">マップに紐づいた団体</CardTitle>
                  <CardDescription>検索・混雑フィルターと連動します。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-64 overflow-auto pr-1">
                  {visibleMapGroups.length > 0 ? visibleMapGroups.map(({ group, point }) => (
                    <div key={`${group.name}-${point.room}`} className="rounded-lg border bg-background p-3 text-sm">
                      <div className="font-semibold">{group.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">{point.floor}・{point.room} / x:{point.x}, y:{point.y}</div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      現在の検索条件に一致する団体、またはマップ座標に紐づく団体がありません。
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Schedule */}
        <section className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                イベントスケジュール
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                9:00〜17:00を30分刻みで表示。今やっているイベントは緑で「やっています」と表示します。
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              現在時刻: <span className="font-mono font-bold text-foreground">{now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>

          {activeEvents.length > 0 && (
            <div className="px-5 pt-4 space-y-2">
              {activeEvents.map((ev) => (
                <div key={ev.id} className="rounded-xl border-2 border-emerald-400 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-800">{ev.venue}：{ev.title} やっています</p>
                    <p className="text-xs text-emerald-700">
                      開催時間 {Math.floor((ev.startMinutes + SCHEDULE_START_HOUR * 60) / 60).toString().padStart(2, "0")}:{((ev.startMinutes) % 60).toString().padStart(2, "0")}
                      〜
                      {Math.floor((ev.endMinutes + SCHEDULE_START_HOUR * 60) / 60).toString().padStart(2, "0")}:{((ev.endMinutes) % 60).toString().padStart(2, "0")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid" style={{ gridTemplateColumns: `60px repeat(${scheduleVenues.length}, minmax(0, 1fr))` }}>
                <div className="text-xs font-bold text-muted-foreground p-2 border-b border-r">時刻</div>
                {scheduleVenues.map((venue) => (
                  <div key={venue} className="text-xs font-bold text-foreground p-2 border-b text-center bg-muted/30">{venue}</div>
                ))}
                {scheduleSlots.map((slot, slotIdx) => (
                  <div key={slot.label} className="contents">
                    <div className="text-[10px] font-mono text-muted-foreground p-1 border-r border-b text-right">{slot.label}</div>
                    {scheduleVenues.map((venue) => {
                      const eventStarting = scheduleEvents.find(
                        (ev) => ev.venue === venue && ev.startMinutes === slot.startMinutes,
                      );
                      const eventCovers = scheduleEvents.find(
                        (ev) =>
                          ev.venue === venue &&
                          slot.startMinutes >= ev.startMinutes &&
                          slot.startMinutes < ev.endMinutes,
                      );
                      const isNowSlot = nowMinutes >= slot.startMinutes && nowMinutes < slot.startMinutes + 30;
                      const isActive = eventCovers && nowMinutes >= eventCovers.startMinutes && nowMinutes < eventCovers.endMinutes;

                      if (eventStarting) {
                        const spanSlots = (eventStarting.endMinutes - eventStarting.startMinutes) / 30;
                        return (
                          <div
                            key={`${venue}-${slot.label}`}
                            className={`relative border-b p-1.5 text-[11px] leading-tight rounded-md m-0.5 ${
                              isActive
                                ? "bg-emerald-500 text-white border-emerald-600"
                                : "bg-primary/15 text-primary border-primary/30"
                            }`}
                            style={{ gridRow: `span ${spanSlots}` }}
                          >
                            <p className="font-bold">{eventStarting.title}</p>
                            {isActive && <p className="text-[9px] font-bold mt-0.5">やっています</p>}
                          </div>
                        );
                      }
                      if (eventCovers) {
                        return null;
                      }
                      return (
                        <div
                          key={`${venue}-${slot.label}`}
                          className={`border-b min-h-[28px] ${slotIdx % 2 === 0 ? "bg-muted/10" : ""} ${isNowSlot ? "ring-1 ring-inset ring-rose-300 bg-rose-50/50" : ""}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Group List */}
        <section>
          {isLoadingGroups ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group, idx) => {
                const isFav = favorites.includes(favoriteKey(group));
                return (
                <Card key={idx} className="overflow-hidden hover:shadow-md transition-all duration-200 border border-border group">
                  <CardHeader className="p-5 pb-4 border-b bg-muted/30">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{group.name}</CardTitle>
                        <CardDescription className="mt-1.5 flex items-center text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {group.location}
                        </CardDescription>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleFavorite(group)}
                          className={`h-8 w-8 ${isFav ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"}`}
                          aria-label={isFav ? "お気に入りから外す" : "お気に入りに追加"}
                          title={isFav ? "お気に入りから外す" : "お気に入りに追加"}
                        >
                          <Star className={`h-5 w-5 ${isFav ? "fill-current" : ""}`} />
                        </Button>
                        {group.logo && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden border bg-background">
                            <img src={group.logo} alt={group.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={`text-sm px-3 py-1 font-medium ${getWaitBadgeColor(group.wait)}`}>
                        {group.wait || "状況不明"}
                      </Badge>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {group.updatedAt ? formatDistanceToNow(group.updatedAt, { addSuffix: true, locale: ja }) : "更新なし"}
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground line-clamp-2 leading-relaxed">
                      {group.desc}
                    </p>

                    {group.comment && (
                      <div className="bg-secondary/20 border border-secondary/30 rounded-lg p-3 text-sm flex gap-2 items-start">
                        <Info className="w-4 h-4 text-secondary-foreground shrink-0 mt-0.5" />
                        <p className="text-secondary-foreground leading-snug">{group.comment}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0 border-t bg-muted/10 flex justify-between items-center text-xs text-muted-foreground">
                    <span>営業時間: {group.hours || "不明"}</span>
                  </CardFooter>
                </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-xl border border-dashed">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">見つかりませんでした</h3>
              <p className="text-muted-foreground">検索条件に一致する団体がありません。</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setWaitFilter("all");
                }}
              >
                条件をクリア
              </Button>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t bg-card py-8">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground text-center md:text-left">
            <p>学園祭リアルタイム混雑状況システム</p>
            {groupsPayload?.fetchedAt && (
              <p className="text-xs mt-1 opacity-70">
                最終データ取得: {new Date(groupsPayload.fetchedAt).toLocaleString('ja-JP')}
              </p>
            )}
          </div>
          
          {groupsPayload?.source && (
            <div className="flex gap-4">
              <Button variant="link" size="sm" asChild className="text-primary hover:text-primary/80">
                <a href={groupsPayload.source.registrationFormUrl} target="_blank" rel="noopener noreferrer">
                  団体登録
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild className="border-primary text-primary hover:bg-primary/5">
                <a href={groupsPayload.source.updateFormUrl} target="_blank" rel="noopener noreferrer">
                  混雑状況を更新
                </a>
              </Button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
