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
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  User,
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Link,
  Hash,
  Calendar,
  Activity,
  UserCheck,
  AlertCircle,
  Zap,
  Lock
} from "lucide-react"

// Mock data for audit trails
const mockAuditTrails = [
  {
    id: "1",
    operation: "update",
    recordType: "KPI",
    recordId: "kpi_001",
    actor: "田中太郎",
    timestamp: "2024-01-15 14:30:25",
    hash: "a1b2c3d4e5f6...",
    prevHash: "f6e5d4c3b2a1...",
    description: "温室効果ガス排出量データの修正",
    verified: true
  },
  {
    id: "2",
    operation: "create",
    recordType: "DataSource",
    recordId: "ds_005",
    actor: "佐藤花子",
    timestamp: "2024-01-15 11:15:10",
    hash: "b2c3d4e5f6a1...",
    prevHash: "a1b2c3d4e5f6...",
    description: "新規データソース「環境部門API」を追加",
    verified: true
  },
  {
    id: "3",
    operation: "delete",
    recordType: "RawRecord",
    recordId: "raw_123",
    actor: "山田次郎",
    timestamp: "2024-01-14 16:45:30",
    hash: "c3d4e5f6a1b2...",
    prevHash: "b2c3d4e5f6a1...",
    description: "重複データレコードを削除",
    verified: true
  },
  {
    id: "4",
    operation: "update",
    recordType: "MappingRule",
    recordId: "map_007",
    actor: "システム",
    timestamp: "2024-01-14 09:20:15",
    hash: "d4e5f6a1b2c3...",
    prevHash: "c3d4e5f6a1b2...",
    description: "AIによるマッピングルール自動更新",
    verified: false
  }
]

const mockWorkflowTasks = [
  {
    id: "1",
    type: "approval",
    title: "CO2排出量データの承認",
    description: "2023年度第4四半期のCO2排出量データの承認が必要です",
    assignee: "環境部長",
    status: "pending",
    priority: "high",
    dueDate: "2024-01-20",
    createdAt: "2024-01-15"
  },
  {
    id: "2",
    type: "review",
    title: "データ品質レビュー",
    description: "人事データの品質チェックとレビューをお願いします",
    assignee: "品質管理者",
    status: "in_progress",
    priority: "medium",
    dueDate: "2024-01-18",
    createdAt: "2024-01-14"
  },
  {
    id: "3",
    type: "correction",
    title: "エネルギー使用量修正",
    description: "単位換算エラーの修正が必要です",
    assignee: "データアナリスト",
    status: "completed",
    priority: "high",
    dueDate: "2024-01-16",
    createdAt: "2024-01-13"
  }
]

const mockComplianceChecks = [
  { category: "ISSB S1", status: "compliant", score: 95, lastCheck: "2024-01-15" },
  { category: "ISSB S2", status: "partial", score: 87, lastCheck: "2024-01-15" },
  { category: "GRI Standards", status: "compliant", score: 92, lastCheck: "2024-01-14" },
  { category: "TCFD", status: "non_compliant", score: 65, lastCheck: "2024-01-14" },
]

const getOperationBadge = (operation: string) => {
  switch (operation) {
    case "create":
      return <Badge variant="default" className="bg-green-100 text-green-800">作成</Badge>
    case "update":
      return <Badge variant="secondary">更新</Badge>
    case "delete":
      return <Badge variant="destructive">削除</Badge>
    default:
      return <Badge variant="outline">{operation}</Badge>
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline">待機中</Badge>
    case "in_progress":
      return <Badge variant="secondary">進行中</Badge>
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
    case "compliant":
      return <Badge variant="default" className="bg-green-100 text-green-800">準拠</Badge>
    case "partial":
      return <Badge variant="secondary">部分準拠</Badge>
    case "non_compliant":
      return <Badge variant="destructive">非準拠</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case "high":
      return <Badge variant="destructive">高</Badge>
    case "medium":
      return <Badge variant="secondary">中</Badge>
    case "low":
      return <Badge variant="outline">低</Badge>
    default:
      return <Badge variant="outline">{priority}</Badge>
  }
}

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedOperation, setSelectedOperation] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">監査証跡</h1>
            <p className="text-muted-foreground mt-2">
              変更履歴とブロックチェーン証跡の管理
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              証跡エクスポート
            </Button>
            <Button size="sm">
              <Shield className="h-4 w-4 mr-2" />
              検証実行
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総監査記録</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                +23 from yesterday
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">検証済み記録</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,239</div>
              <p className="text-xs text-muted-foreground">
                99.4% verified
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待機中タスク</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                2 high priority
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">コンプライアンス</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <Progress value={85} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="trails" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trails">監査証跡</TabsTrigger>
            <TabsTrigger value="workflow">ワークフロー</TabsTrigger>
            <TabsTrigger value="compliance">コンプライアンス</TabsTrigger>
            <TabsTrigger value="blockchain">ブロックチェーン</TabsTrigger>
          </TabsList>

          {/* Audit Trails Tab */}
          <TabsContent value="trails" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>監査証跡一覧</CardTitle>
                    <CardDescription>
                      すべてのデータ変更履歴と操作記録
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="記録を検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64"
                      />
                    </div>
                    <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="操作選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        <SelectItem value="create">作成</SelectItem>
                        <SelectItem value="update">更新</SelectItem>
                        <SelectItem value="delete">削除</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>操作</TableHead>
                      <TableHead>対象</TableHead>
                      <TableHead>実行者</TableHead>
                      <TableHead>日時</TableHead>
                      <TableHead>ハッシュ</TableHead>
                      <TableHead>検証</TableHead>
                      <TableHead>アクション</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockAuditTrails.map((trail) => (
                      <TableRow key={trail.id}>
                        <TableCell>{getOperationBadge(trail.operation)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{trail.recordType}</p>
                            <p className="text-sm text-muted-foreground">{trail.recordId}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{trail.actor}</span>
                          </div>
                        </TableCell>
                        <TableCell>{trail.timestamp}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Hash className="h-3 w-3" />
                            <span className="font-mono text-xs">{trail.hash}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trail.verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Tab */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>ワークフロータスク</CardTitle>
                    <CardDescription>
                      承認・レビュー・修正が必要なタスク
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="ステータス" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        <SelectItem value="pending">待機中</SelectItem>
                        <SelectItem value="in_progress">進行中</SelectItem>
                        <SelectItem value="completed">完了</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm">
                      新規タスク
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockWorkflowTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {task.type === "approval" && <UserCheck className="h-5 w-5 text-primary" />}
                          {task.type === "review" && <Eye className="h-5 w-5 text-primary" />}
                          {task.type === "correction" && <AlertTriangle className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold">{task.title}</h3>
                            {getPriorityBadge(task.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>担当: {task.assignee}</span>
                            <span>期限: {task.dueDate}</span>
                            <span>作成: {task.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(task.status)}
                        <Button variant="ghost" size="sm">
                          詳細
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>コンプライアンス状況</CardTitle>
                <CardDescription>
                  各種基準への準拠状況
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockComplianceChecks.map((check, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{check.category}</h3>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(check.status)}
                          <span className="text-sm text-muted-foreground">
                            最終チェック: {check.lastCheck}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>準拠スコア</span>
                          <span>{check.score}%</span>
                        </div>
                        <Progress value={check.score} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>コンプライアンスアラート</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">TCFD要求事項不足</p>
                      <p className="text-xs text-muted-foreground">
                        気候関連リスクの定量的分析が不足しています
                      </p>
                    </div>
                    <Badge variant="destructive">高</Badge>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">ISSB S2 部分準拠</p>
                      <p className="text-xs text-muted-foreground">
                        Scope3排出量の算定方法を見直してください
                      </p>
                    </div>
                    <Badge variant="outline">中</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blockchain Tab */}
          <TabsContent value="blockchain" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ブロックチェーン証跡</CardTitle>
                <CardDescription>
                  改ざん検知機能付きデータ証跡チェーン
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAuditTrails.slice(0, 3).map((trail, index) => (
                    <div key={trail.id} className="relative">
                      <div className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Lock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">ブロック #{trail.id}</h3>
                            {trail.verified ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">検証済み</Badge>
                            ) : (
                              <Badge variant="outline">未検証</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">ハッシュ</p>
                              <p className="font-mono text-xs">{trail.hash}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">前ブロックハッシュ</p>
                              <p className="font-mono text-xs">{trail.prevHash}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">タイムスタンプ</p>
                              <p>{trail.timestamp}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">操作者</p>
                              <p>{trail.actor}</p>
                            </div>
                          </div>
                          <p className="text-sm mt-2">{trail.description}</p>
                        </div>
                      </div>
                      {index < 2 && (
                        <div className="flex justify-center my-2">
                          <Link className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold">チェーン整合性</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    すべてのブロックが正常に連鎖しており、改ざんは検出されていません。
                  </p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span>最終検証: 2024-01-15 15:30:00</span>
                    <span>チェーン長: 1,247 ブロック</span>
                    <span>整合性: 100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 