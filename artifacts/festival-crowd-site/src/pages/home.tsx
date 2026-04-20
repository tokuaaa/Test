import { useListFestivalGroups, getListFestivalGroupsQueryKey, useGetFestivalSummary, getGetFestivalSummaryQueryKey } from "@workspace/api-client-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, MapPin, Search, Filter, AlertCircle, Info, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: groupsPayload, isLoading: isLoadingGroups, refetch: refetchGroups, isFetching: isFetchingGroups } = useListFestivalGroups({
    query: { queryKey: getListFestivalGroupsQueryKey() }
  });

  const { data: summary, isLoading: isLoadingSummary } = useGetFestivalSummary({
    query: { queryKey: getGetFestivalSummaryQueryKey() }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [waitFilter, setWaitFilter] = useState<string>("all");

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

  return (
    <div className="min-h-screen flex flex-col bg-background pb-12">
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
            onClick={() => refetchGroups()} 
            disabled={isFetchingGroups}
            className={isFetchingGroups ? "animate-spin" : ""}
          >
            <RefreshCw className="h-5 w-5" />
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
              {filteredGroups.map((group, idx) => (
                <Card key={idx} className="overflow-hidden hover:shadow-md transition-all duration-200 border border-border group">
                  <CardHeader className="p-5 pb-4 border-b bg-muted/30">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{group.name}</CardTitle>
                        <CardDescription className="mt-1.5 flex items-center text-xs text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {group.location}
                        </CardDescription>
                      </div>
                      {group.logo && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border bg-background">
                          <img src={group.logo} alt={group.name} className="w-full h-full object-cover" />
                        </div>
                      )}
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
              ))}
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
