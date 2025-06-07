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
import { Label } from "@/components/ui/label"
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
  Zap
} from "lucide-react"

// Mock data - in real app this would come from API
const mockDataSources = [
  { id: "1", name: "人事部門", type: "csv", department: "人事", records: 1250, lastUpdate: "2024-01-15" },
  { id: "2", name: "財務API", type: "api", department: "財務", records: 890, lastUpdate: "2024-01-15" },
  { id: "3", name: "環境データ", type: "webhook", department: "環境", records: 2100, lastUpdate: "2024-01-14" },
]

const mockRawRecords = [
  { id: "1", source: "人事部門", filename: "employee_data_2024.csv", status: "processed", records: 1250, uploadTime: "2024-01-15 10:30" },
  { id: "2", source: "財務API", filename: "financial_metrics.json", status: "processing", records: 890, uploadTime: "2024-01-15 09:15" },
  { id: "3", source: "環境データ", filename: "carbon_emissions.xlsx", status: "pending", records: 2100, uploadTime: "2024-01-14 16:45" },
  { id: "4", source: "人事部門", filename: "diversity_report.csv", status: "error", records: 0, uploadTime: "2024-01-14 14:20" },
]

const mockKPIMappings = [
  { id: "1", column: "CO2_emissions", kpi: "温室効果ガス排出量", confidence: 95, status: "validated", unit: "tCO2e" },
  { id: "2", column: "employee_count", kpi: "従業員数", confidence: 98, status: "validated", unit: "人" },
  { id: "3", column: "energy_usage", kpi: "エネルギー消費量", confidence: 87, status: "pending", unit: "MWh" },
  { id: "4", column: "water_consumption", kpi: "水使用量", confidence: 92, status: "validated", unit: "m³" },
]

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

export default function DataPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSource, setSelectedSource] = useState("all")

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
            <Button size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
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
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理済みレコード</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4,240</div>
              <p className="text-xs text-muted-foreground">
                +180 from yesterday
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">データ品質スコア</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <Progress value={94} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                2 files in queue
              </p>
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
                <div className="space-y-4">
                  {mockDataSources.map((source) => (
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
                        <SelectItem value="人事部門">人事部門</SelectItem>
                        <SelectItem value="財務API">財務API</SelectItem>
                        <SelectItem value="環境データ">環境データ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
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
                    {mockRawRecords.map((record) => (
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
                    ))}
                  </TableBody>
                </Table>
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
                    {mockKPIMappings.map((mapping) => (
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
                            <Button variant="ghost" size="sm">
                              承認
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

          {/* Data Quality Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>データ品質メトリクス</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>完全性</span>
                      <span>96%</span>
                    </div>
                    <Progress value={96} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>正確性</span>
                      <span>94%</span>
                    </div>
                    <Progress value={94} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>一貫性</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>適時性</span>
                      <span>98%</span>
                    </div>
                    <Progress value={98} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>品質アラート</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">重複データ検出</p>
                        <p className="text-xs text-muted-foreground">employee_data_2024.csv</p>
                      </div>
                      <Badge variant="outline">中</Badge>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">必須フィールド欠損</p>
                        <p className="text-xs text-muted-foreground">carbon_emissions.xlsx</p>
                      </div>
                      <Badge variant="destructive">高</Badge>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">品質チェック完了</p>
                        <p className="text-xs text-muted-foreground">financial_metrics.json</p>
                      </div>
                      <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
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