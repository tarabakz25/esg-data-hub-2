"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingDown,
  RefreshCw,
  Download,
  Send
} from "lucide-react"
import { MissingKPIAlert } from "@/lib/types"

interface MissingKPIData {
  missing_kpis: MissingKPIAlert[]
  summary: {
    total_required: number
    total_missing: number
    by_category: Record<string, number>
    by_urgency: Record<string, number>
  }
}

const defaultSummary = {
  total_required: 0,
  total_missing: 0,
  by_category: {},
  by_urgency: {}
}

export default function MissingKPIsPage() {
  const [data, setData] = useState<MissingKPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().getFullYear().toString())
  const [selectedCategory, setSelectedCategory] = useState("all")
  
  const { user, isLoading } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    if (!isLoading && user) {
      fetchMissingKPIs()
    }
  }, [selectedPeriod, isLoading, user])

  const fetchMissingKPIs = async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.error('No active session')
        setError('認証セッションが見つかりません')
        return
      }

      const response = await fetch(`/api/missing-kpis?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        // サマリーが存在しない場合のデフォルト値を設定
        const processedResult = {
          missing_kpis: result.missing_kpis || [],
          summary: result.summary || defaultSummary
        }
        setData(processedResult)
      } else {
        const errorText = await response.text()
        console.error('Failed to fetch missing KPIs:', response.status, response.statusText, errorText)
        setError(`データの取得に失敗しました: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to fetch missing KPIs:', error)
      setError('データの取得中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const sendReminder = async (kpiId: string) => {
    try {
      const response = await fetch('/api/missing-kpis/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpi_id: kpiId, period: selectedPeriod })
      })
      
      if (response.ok) {
        // リマインダー送信成功の処理
        console.log('Reminder sent successfully')
      }
    } catch (error) {
      console.error('Failed to send reminder:', error)
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'default'
      case 'low':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getUrgencyText = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return '不明'
    }
  }

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'environmental':
        return '環境'
      case 'social':
        return '社会'
      case 'governance':
        return 'ガバナンス'
      default:
        return category
    }
  }

  const filteredKPIs = data?.missing_kpis?.filter(kpi => 
    selectedCategory === 'all' || kpi.category === selectedCategory
  ) || []

  // エラー状態の表示
  if (error) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto py-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>エラーが発生しました</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchMissingKPIs} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            再試行
          </Button>
        </main>
      </div>
    )
  }

  // ローディング状態の表示
  if (loading || !data) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto py-6">
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-8 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // データが正常に取得できた場合のサマリー情報（デフォルト値を使用）
  const summary = data.summary || defaultSummary

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto py-6 space-y-6 px-5">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">欠損KPIチェック</h1>
          <p className="text-muted-foreground">
            ISSB必須KPIの欠損状況を確認し、データ収集を促進します
          </p>
        </div>

        {/* フィルター */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="期間を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024年</SelectItem>
              <SelectItem value="2023">2023年</SelectItem>
              <SelectItem value="2022">2022年</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="カテゴリを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="environmental">環境</SelectItem>
              <SelectItem value="social">社会</SelectItem>
              <SelectItem value="governance">ガバナンス</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={fetchMissingKPIs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              更新
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>

        {/* サマリーカード */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">必須KPI総数</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_required}
              </div>
              <p className="text-xs text-muted-foreground">
                ISSB基準必須項目
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">欠損KPI</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {summary.total_missing}
              </div>
              <p className="text-xs text-muted-foreground">
                要対応項目
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">完了率</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.total_required 
                  ? Math.round(((summary.total_required - summary.total_missing) / summary.total_required) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                データ収集完了率
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">高優先度</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {summary.by_urgency.high || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                緊急対応必要
              </p>
            </CardContent>
          </Card>
        </div>

        {/* アラート */}
        {summary.total_missing > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>欠損KPIが検出されました</AlertTitle>
            <AlertDescription>
              {summary.total_missing}件の必須KPIが不足しています。
              特に高優先度の{summary.by_urgency.high || 0}件は早急な対応が必要です。
            </AlertDescription>
          </Alert>
        )}

        {/* タブコンテンツ */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">欠損KPI一覧</TabsTrigger>
            <TabsTrigger value="category">カテゴリ別</TabsTrigger>
            <TabsTrigger value="urgency">優先度別</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>欠損KPI一覧</CardTitle>
                <CardDescription>
                  {selectedPeriod}年の欠損KPI詳細（{filteredKPIs.length}件）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KPI名</TableHead>
                      <TableHead>カテゴリ</TableHead>
                      <TableHead>優先度</TableHead>
                      <TableHead>最終報告</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKPIs.map((kpi) => (
                      <TableRow key={kpi.kpi_id}>
                        <TableCell className="font-medium">
                          {kpi.kpi_name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryText(kpi.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getUrgencyColor(kpi.urgency) as any}>
                            {getUrgencyText(kpi.urgency)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {kpi.last_reported 
                            ? new Date(kpi.last_reported).toLocaleDateString('ja-JP')
                            : '未報告'
                          }
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendReminder(kpi.kpi_id)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            リマインダー
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="category" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(summary.by_category).map(([category, count]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle>{getCategoryText(category)}</CardTitle>
                    <CardDescription>
                      欠損KPI数
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-500">
                      {count}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      カテゴリ別欠損状況
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="urgency" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-3">
              {Object.entries(summary.by_urgency).map(([urgency, count]) => (
                <Card key={urgency}>
                  <CardHeader>
                    <CardTitle>優先度: {getUrgencyText(urgency)}</CardTitle>
                    <CardDescription>
                      対応必要KPI数
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-3xl font-bold ${
                      urgency === 'high' ? 'text-red-500' :
                      urgency === 'medium' ? 'text-orange-500' :
                      'text-blue-500'
                    }`}>
                      {count}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {urgency === 'high' ? '緊急対応必要' :
                       urgency === 'medium' ? '早期対応推奨' :
                       '通常対応'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 