"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Database,
  FileText,
  Clock,
  Users,
  Target
} from "lucide-react"
import { Navigation } from "@/components/navigation"

export default function DashboardPage() {
  // サンプルデータ
  const stats = {
    totalDataSources: 12,
    processedRecords: 1847,
    mappedKPIs: 156,
    missingKPIs: 3,
    complianceRate: 87,
    lastUpdated: "2024-12-07 14:30",
  }

  const recentUploads = [
    { name: "環境データ_2024Q3.csv", status: "完了", date: "2024-12-07", records: 245 },
    { name: "社会データ_2024Q3.xlsx", status: "処理中", date: "2024-12-06", records: 189 },
    { name: "ガバナンス_2024Q3.json", status: "完了", date: "2024-12-05", records: 67 },
  ]

  const missingKPIs = [
    { category: "環境", name: "Scope3排出量", priority: "高", deadline: "2024-12-15" },
    { category: "社会", name: "女性管理職比率", priority: "中", deadline: "2024-12-20" },
    { category: "ガバナンス", name: "取締役会多様性", priority: "低", deadline: "2024-12-25" },
  ]

  const categoryProgress = [
    { name: "環境 (E)", completed: 45, total: 52, percentage: 87 },
    { name: "社会 (S)", completed: 38, total: 44, percentage: 86 },
    { name: "ガバナンス (G)", completed: 28, total: 32, percentage: 88 },
  ]

  return (
    <div>
      <Navigation />

      <div className="container mx-auto p-6 space-y-6 px-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">ESGダッシュボード</h1>
            <p className="text-gray-600 mt-1">データ収集・正規化・監査証跡の統合管理</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            最終更新: {stats.lastUpdated}
          </div>
        </div>

        {/* KPI概要カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">データソース</CardTitle>
              <Database className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDataSources}</div>
              <p className="text-xs text-gray-600">接続中のデータ源</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理済レコード</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processedRecords.toLocaleString()}</div>
              <p className="text-xs text-gray-600">正規化済みデータ</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">マップ済KPI</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mappedKPIs}</div>
              <p className="text-xs text-gray-600">自動マッピング完了</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ISSB準拠率</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceRate}%</div>
              <p className="text-xs text-gray-600">基準適合度</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="progress">進捗状況</TabsTrigger>
            <TabsTrigger value="recent">最近の活動</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ESGカテゴリ別進捗 */}
              <Card>
                <CardHeader>
                  <CardTitle>ESGカテゴリ別完成度</CardTitle>
                  <CardDescription>各カテゴリのデータ収集進捗</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryProgress.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span>{category.completed}/{category.total} ({category.percentage}%)</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 欠損KPI */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    要対応KPI ({stats.missingKPIs}件)
                  </CardTitle>
                  <CardDescription>ISSB基準で必須のデータが不足</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {missingKPIs.map((kpi, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{kpi.category}</Badge>
                            <span className="font-medium">{kpi.name}</span>
                          </div>
                          <p className="text-xs text-gray-600">期限: {kpi.deadline}</p>
                        </div>
                        <Badge variant={
                          kpi.priority === "高" ? "destructive" : 
                          kpi.priority === "中" ? "default" : "secondary"
                        }>
                          {kpi.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    欠損KPI詳細を確認
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>データ処理パイプライン状況</CardTitle>
                <CardDescription>取込からレポート生成までの自動化状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold">データ取込</h3>
                    <p className="text-sm text-gray-600 mt-1">CSV/Excel/API</p>
                    <Badge className="mt-2" variant="default">稼働中</Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold">AI正規化</h3>
                    <p className="text-sm text-gray-600 mt-1">OpenAI マッピング</p>
                    <Badge className="mt-2" variant="default">稼働中</Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold">レポート生成</h3>
                    <p className="text-sm text-gray-600 mt-1">ISSB準拠</p>
                    <Badge className="mt-2" variant="secondary">準備中</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>最近のデータアップロード</CardTitle>
                <CardDescription>直近のファイル処理状況</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUploads.map((upload, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          upload.status === "完了" ? "bg-green-500" : "bg-yellow-500"
                        }`} />
                        <div>
                          <p className="font-medium">{upload.name}</p>
                          <p className="text-sm text-gray-600">{upload.date} • {upload.records}件</p>
                        </div>
                      </div>
                      <Badge variant={upload.status === "完了" ? "default" : "secondary"}>
                        {upload.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* クイックアクション */}
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使用される機能への直接アクセス</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Upload className="h-6 w-6" />
                データ取込
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <AlertTriangle className="h-6 w-6" />
                欠損チェック
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <FileText className="h-6 w-6" />
                レポート生成
              </Button>
              <Button className="h-20 flex-col gap-2" variant="outline">
                <Users className="h-6 w-6" />
                監査証跡
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
