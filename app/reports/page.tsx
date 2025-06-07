"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart,
  Calendar,
  Filter,
  Share,
  Eye,
  CheckCircle,
  AlertTriangle,
  Target,
  Globe,
  Users,
  Leaf
} from "lucide-react"

// Mock data for reports
const mockReports = [
  { 
    id: "1", 
    name: "ISSB S1 一般要求事項", 
    type: "ISSB", 
    status: "completed", 
    lastGenerated: "2024-01-15", 
    coverage: 95,
    period: "2023年度"
  },
  { 
    id: "2", 
    name: "ISSB S2 気候関連開示", 
    type: "ISSB", 
    status: "in_progress", 
    lastGenerated: "2024-01-14", 
    coverage: 87,
    period: "2023年度"
  },
  { 
    id: "3", 
    name: "統合レポート", 
    type: "Integrated", 
    status: "draft", 
    lastGenerated: "2024-01-13", 
    coverage: 78,
    period: "2023年度"
  },
]

const mockBenchmarks = [
  { category: "温室効果ガス排出量", ourValue: 1250, industry: 1450, unit: "tCO2e", trend: "down", change: -12 },
  { category: "エネルギー消費量", ourValue: 2800, industry: 3200, unit: "MWh", trend: "down", change: -8 },
  { category: "水使用量", ourValue: 15000, industry: 18000, unit: "m³", trend: "down", change: -15 },
  { category: "従業員満足度", ourValue: 4.2, industry: 3.8, unit: "点", trend: "up", change: 12 },
  { category: "女性管理職比率", ourValue: 32, industry: 28, unit: "%", trend: "up", change: 8 },
]

const mockKPIData = [
  { kpi: "Scope1排出量", current: 450, target: 400, unit: "tCO2e", progress: 88, status: "on_track" },
  { kpi: "Scope2排出量", current: 800, target: 700, unit: "tCO2e", progress: 75, status: "behind" },
  { kpi: "再生可能エネルギー比率", current: 65, target: 80, unit: "%", progress: 81, status: "on_track" },
  { kpi: "廃棄物リサイクル率", current: 78, target: 85, unit: "%", progress: 92, status: "ahead" },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
    case "in_progress":
      return <Badge variant="secondary">作成中</Badge>
    case "draft":
      return <Badge variant="outline">下書き</Badge>
    case "on_track":
      return <Badge variant="default" className="bg-blue-100 text-blue-800">順調</Badge>
    case "behind":
      return <Badge variant="destructive">遅れ</Badge>
    case "ahead":
      return <Badge variant="default" className="bg-green-100 text-green-800">前倒し</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getTrendIcon = (trend: string, change: number) => {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4 text-green-500" />
  } else {
    return <TrendingDown className="h-4 w-4 text-red-500" />
  }
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("2023")
  const [selectedCategory, setSelectedCategory] = useState("all")

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">レポート</h1>
            <p className="text-muted-foreground mt-2">
              ISSB準拠レポートの生成とベンチマーク分析
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              共有
            </Button>
            <Button size="sm">
              <Download className="h-4 w-4 mr-2" />
              エクスポート
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">生成済みレポート</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ISSB準拠率</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">91%</div>
              <Progress value={91} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">業界ランキング</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12位</div>
              <p className="text-xs text-muted-foreground">
                Top 15% in sector
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">目標達成率</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">84%</div>
              <p className="text-xs text-muted-foreground">
                7 of 9 targets met
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reports">レポート一覧</TabsTrigger>
            <TabsTrigger value="benchmark">ベンチマーク</TabsTrigger>
            <TabsTrigger value="kpis">KPI進捗</TabsTrigger>
            <TabsTrigger value="analytics">分析</TabsTrigger>
          </TabsList>

          {/* Reports List Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>レポート一覧</CardTitle>
                    <CardDescription>
                      生成済みおよび作成中のレポート
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="期間選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023">2023年度</SelectItem>
                        <SelectItem value="2022">2022年度</SelectItem>
                        <SelectItem value="2021">2021年度</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm">
                      新規作成
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>レポート名</TableHead>
                      <TableHead>種類</TableHead>
                      <TableHead>対象期間</TableHead>
                      <TableHead>カバレッジ</TableHead>
                      <TableHead>ステータス</TableHead>
                      <TableHead>最終更新</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>{report.type}</TableCell>
                        <TableCell>{report.period}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={report.coverage} className="w-16" />
                            <span className="text-sm">{report.coverage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>{report.lastGenerated}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benchmark Tab */}
          <TabsContent value="benchmark" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>業界ベンチマーク</CardTitle>
                <CardDescription>
                  同業他社との比較分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockBenchmarks.map((benchmark, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {benchmark.category.includes("温室効果ガス") && <Leaf className="h-5 w-5 text-primary" />}
                          {benchmark.category.includes("エネルギー") && <Leaf className="h-5 w-5 text-primary" />}
                          {benchmark.category.includes("水") && <Globe className="h-5 w-5 text-primary" />}
                          {benchmark.category.includes("従業員") && <Users className="h-5 w-5 text-primary" />}
                          {benchmark.category.includes("女性") && <Users className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{benchmark.category}</h3>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>自社: {benchmark.ourValue.toLocaleString()}{benchmark.unit}</span>
                            <span>•</span>
                            <span>業界平均: {benchmark.industry.toLocaleString()}{benchmark.unit}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(benchmark.trend, benchmark.change)}
                        <span className={`text-sm font-medium ${
                          benchmark.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {benchmark.change > 0 ? '+' : ''}{benchmark.change}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KPI Progress Tab */}
          <TabsContent value="kpis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>KPI進捗状況</CardTitle>
                <CardDescription>
                  設定目標に対する進捗状況
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockKPIData.map((kpi, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{kpi.kpi}</h3>
                        {getStatusBadge(kpi.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>現在値: {kpi.current.toLocaleString()}{kpi.unit}</span>
                        <span>目標値: {kpi.target.toLocaleString()}{kpi.unit}</span>
                      </div>
                      <div className="space-y-1">
                        <Progress value={kpi.progress} />
                        <div className="text-right text-xs text-muted-foreground">
                          {kpi.progress}% 達成
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>カテゴリ別分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm">環境 (E)</span>
                      </div>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <Progress value={85} />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">社会 (S)</span>
                      </div>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                    <Progress value={78} />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">ガバナンス (G)</span>
                      </div>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>改善提案</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Scope2排出量削減</p>
                        <p className="text-xs text-muted-foreground">
                          再生可能エネルギーの導入を検討してください
                        </p>
                      </div>
                      <Badge variant="outline">高</Badge>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">データ収集の自動化</p>
                        <p className="text-xs text-muted-foreground">
                          API連携でデータ品質を向上できます
                        </p>
                      </div>
                      <Badge variant="outline">中</Badge>
                    </div>
                    <div className="flex items-start space-x-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">ガバナンス体制</p>
                        <p className="text-xs text-muted-foreground">
                          優秀な取り組みです。継続してください
                        </p>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">良好</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 