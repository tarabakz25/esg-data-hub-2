"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  BarChart3, 
  Upload, 
  Database, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  FileText,
  Clock
} from "lucide-react"
import { DashboardData } from "@/lib/types"

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard')
        if (response.ok) {
          const data = await response.json()
          setDashboardData(data)
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto py-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const processingRate = dashboardData 
    ? Math.round((dashboardData.processed_records / Math.max(dashboardData.total_records, 1)) * 100)
    : 0

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto py-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">ESGデータダッシュボード</h1>
          <p className="text-muted-foreground">
            ISSB基準対応のESGデータ統合プラットフォーム
          </p>
        </div>

        {/* アラート */}
        {dashboardData && dashboardData.missing_kpis > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>欠損KPIが検出されました</AlertTitle>
            <AlertDescription>
              {dashboardData.missing_kpis}件の必須KPIが不足しています。
              <Button variant="link" className="p-0 h-auto ml-2">
                詳細を確認
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* メトリクスカード */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総データ件数</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.total_records.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                取込済みデータ
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理済み件数</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.processed_records.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                正規化完了
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">欠損KPI</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.missing_kpis || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                要対応項目
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">データ品質</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData?.data_quality_score || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                品質スコア
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 処理進捗 */}
        <Card>
          <CardHeader>
            <CardTitle>データ処理進捗</CardTitle>
            <CardDescription>
              取込データの正規化・マッピング状況
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>処理完了率</span>
                <span>{processingRate}%</span>
              </div>
              <Progress value={processingRate} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">処理済み: </span>
                <span className="font-medium">
                  {dashboardData?.processed_records.toLocaleString() || 0}件
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">未処理: </span>
                <span className="font-medium">
                  {((dashboardData?.total_records || 0) - (dashboardData?.processed_records || 0)).toLocaleString()}件
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 最近のアップロード */}
          <Card>
            <CardHeader>
              <CardTitle>最近のアップロード</CardTitle>
              <CardDescription>
                直近のデータ取込状況
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recent_uploads.length ? (
                  dashboardData.recent_uploads.map((upload) => (
                    <div key={upload.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {upload.original_filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(upload.upload_timestamp).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <Badge variant={upload.processed ? "default" : "secondary"}>
                        {upload.processed ? "完了" : "処理中"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    アップロードされたファイルがありません
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 保留中のタスク */}
          <Card>
            <CardHeader>
              <CardTitle>保留中のタスク</CardTitle>
              <CardDescription>
                承認・レビュー待ちの項目
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.pending_tasks.length ? (
                  dashboardData.pending_tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {task.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(task.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {task.type === 'approval' ? '承認' : 
                         task.type === 'review' ? 'レビュー' : '修正'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    保留中のタスクはありません
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>
              よく使用される機能への素早いアクセス
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button asChild className="h-20 flex-col space-y-2" variant="outline">
                <Link href="/upload">
                  <Upload className="h-6 w-6" />
                  <span>データ取込</span>
                </Link>
              </Button>
              <Button asChild className="h-20 flex-col space-y-2" variant="outline">
                <Link href="/missing-kpis">
                  <AlertTriangle className="h-6 w-6" />
                  <span>欠損チェック</span>
                </Link>
              </Button>
              <Button asChild className="h-20 flex-col space-y-2" variant="outline">
                <Link href="/reports">
                  <BarChart3 className="h-6 w-6" />
                  <span>レポート生成</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
