"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useDataSources, useRawRecords, useKPIMappings, useDataStats } from "@/hooks/use-data-management"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Database, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  FileText,
  Zap,
  Loader2
} from "lucide-react"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "processed":
    case "validated":
      return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
    case "processing":
      return <Badge variant="secondary">処理中</Badge>
    case "pending":
      return <Badge variant="outline">待機中</Badge>
    case "error":
      return <Badge variant="destructive">エラー</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case "error":
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    default:
      return <CheckCircle className="h-5 w-5 text-green-500" />
  }
}

const getAlertBadge = (severity: string) => {
  switch (severity) {
    case "high":
      return <Badge variant="destructive">高</Badge>
    case "medium":
      return <Badge variant="outline">中</Badge>
    case "low":
      return <Badge variant="secondary">低</Badge>
    default:
      return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
  }
}

export default function DataPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSource, setSelectedSource] = useState("all")
  
  const { user, isLoading: authLoading } = useAuth()
  const { dataSources, loading: sourcesLoading, error: sourcesError, refetch: refetchSources } = useDataSources()
  const { rawRecords, loading: recordsLoading, error: recordsError, refetch: refetchRecords } = useRawRecords(searchTerm, selectedSource)
  const { mappings, loading: mappingsLoading, error: mappingsError, refetch: refetchMappings, updateMapping } = useKPIMappings()
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDataStats()

  const handleRefresh = async () => {
    await Promise.all([
      refetchSources(),
      refetchRecords(),
      refetchMappings(),
      refetchStats()
    ])
  }

  const handleApproveMapping = async (id: string) => {
    await updateMapping(id, true)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">読み込み中...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8 px-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              データ管理機能を使用するにはログインが必要です。
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">データ管理</h1>
            <p className="text-muted-foreground mt-2">
              ESGデータの取込、正規化、品質管理を行います
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              エクスポート
            </Button>
            <Button size="sm" onClick={handleRefresh} disabled={statsLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
              同期
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総データソース</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.overview.totalDataSources || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.overview.newSourcesLastMonth || 0} from last month
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理済みレコード</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.overview.processedRecords?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{stats?.overview.recordsYesterday || 0} from yesterday
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">データ品質スコア</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.overview.dataQualityScore || 0}%</div>
                  <Progress value={stats?.overview.dataQualityScore || 0} className="mt-2" />
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.overview.pendingRecords || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.overview.pendingRecords ? `${stats.overview.pendingRecords} files in queue` : 'No files in queue'}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="sources" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sources">データソース</TabsTrigger>
            <TabsTrigger value="records">生データ</TabsTrigger>
            <TabsTrigger value="mapping">KPIマッピング</TabsTrigger>
            <TabsTrigger value="quality">品質管理</TabsTrigger>
          </TabsList>

          {/* Data Sources Tab */}
          <TabsContent value="sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>データソース一覧</CardTitle>
                <CardDescription>
                  接続されているデータソースの状況を確認できます
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sourcesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    読み込み中...
                  </div>
                ) : sourcesError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      データソースの読み込みに失敗しました: {sourcesError}
                    </AlertDescription>
                  </Alert>
                ) : dataSources.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    データソースがありません
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dataSources.map((source) => (
                      <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            {source.type === "csv" && <FileText className="h-5 w-5 text-primary" />}
                            {source.type === "api" && <Zap className="h-5 w-5 text-primary" />}
                            {source.type === "webhook" && <Database className="h-5 w-5 text-primary" />}
                          </div>
                          <div>
                            <h3 className="font-semibold">{source.name}</h3>
                            <p className="text-sm text-muted-foreground">{source.department}部門</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{source.records.toLocaleString()} レコード</p>
                          <p className="text-sm text-muted-foreground">最終更新: {source.lastUpdate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Raw Records Tab */}
          <TabsContent value="records" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>生データレコード</CardTitle>
                    <CardDescription>
                      アップロードされた生データの処理状況
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ファイル名で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="ソース選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        {dataSources.map((source) => (
                          <SelectItem key={source.id} value={source.name}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {recordsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    読み込み中...
                  </div>
                ) : recordsError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      レコードの読み込みに失敗しました: {recordsError}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ファイル名</TableHead>
                        <TableHead>ソース</TableHead>
                        <TableHead>レコード数</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead>アップロード時刻</TableHead>
                        <TableHead>アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rawRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            レコードがありません
                          </TableCell>
                        </TableRow>
                      ) : (
                        rawRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.filename}</TableCell>
                            <TableCell>{record.source}</TableCell>
                            <TableCell>{record.records.toLocaleString()}</TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell>{record.uploadTime}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm">
                                詳細
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPI Mapping Tab */}
          <TabsContent value="mapping" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KPIマッピング</CardTitle>
                <CardDescription>
                  データ列とKPIの自動マッピング結果
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mappingsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    読み込み中...
                  </div>
                ) : mappingsError ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      マッピングの読み込みに失敗しました: {mappingsError}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>データ列</TableHead>
                        <TableHead>マッピング先KPI</TableHead>
                        <TableHead>信頼度</TableHead>
                        <TableHead>単位</TableHead>
                        <TableHead>ステータス</TableHead>
                        <TableHead>アクション</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            マッピングがありません
                          </TableCell>
                        </TableRow>
                      ) : (
                        mappings.map((mapping) => (
                          <TableRow key={mapping.id}>
                            <TableCell className="font-mono text-sm">{mapping.column}</TableCell>
                            <TableCell>{mapping.kpi}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Progress value={mapping.confidence} className="w-16" />
                                <span className="text-sm">{mapping.confidence}%</span>
                              </div>
                            </TableCell>
                            <TableCell>{mapping.unit}</TableCell>
                            <TableCell>{getStatusBadge(mapping.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm">
                                  編集
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleApproveMapping(mapping.id)}
                                  disabled={mapping.status === 'validated'}
                                >
                                  {mapping.status === 'validated' ? '承認済み' : '承認'}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>データ品質メトリクス</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      読み込み中...
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>完全性</span>
                          <span>{stats?.quality.completeness || 0}%</span>
                        </div>
                        <Progress value={stats?.quality.completeness || 0} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>正確性</span>
                          <span>{stats?.quality.accuracy || 0}%</span>
                        </div>
                        <Progress value={stats?.quality.accuracy || 0} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>一貫性</span>
                          <span>{stats?.quality.consistency || 0}%</span>
                        </div>
                        <Progress value={stats?.quality.consistency || 0} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>適時性</span>
                          <span>{stats?.quality.timeliness || 0}%</span>
                        </div>
                        <Progress value={stats?.quality.timeliness || 0} />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>品質アラート</CardTitle>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      読み込み中...
                    </div>
                  ) : stats?.alerts && stats.alerts.length > 0 ? (
                    <div className="space-y-3">
                      {stats.alerts.map((alert, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                          </div>
                          {getAlertBadge(alert.severity)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      品質アラートはありません
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 