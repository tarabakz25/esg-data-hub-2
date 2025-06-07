import { Suspense } from "react"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AuditFilters } from "@/components/audit/audit-filters"
import { AuditTrailsTable } from "@/components/audit/audit-trails-table"
import { WorkflowTasks } from "@/components/audit/workflow-tasks"
import { ComplianceChecks } from "@/components/audit/compliance-checks"
import { getAuditData } from "@/lib/services/audit"
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  Download,
  Activity,
  Hash,
  Link,
  Lock,
  AlertTriangle
} from "lucide-react"

// Helper function to format timestamp
function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

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

interface AuditPageProps {
  searchParams?: Promise<{
    search?: string
    operation?: string
    status?: string
  }>
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams
  const search = params?.search || ""
  const operation = params?.operation || "all"
  const status = params?.status || "all"

  // Fetch audit data
  const { stats, compliance, blockchain } = await getAuditData()

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
              <div className="text-2xl font-bold">{stats.total_records.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ブロックチェーン記録
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">検証済み記録</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verified_records.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total_records > 0 ? Math.round((stats.verified_records / stats.total_records) * 100) : 0}% 検証率
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待機中タスク</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_tasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.high_priority_tasks}件が高優先度
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">コンプライアンス</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.compliance_score}%</div>
              <Progress value={stats.compliance_score} className="mt-2" />
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
                  <AuditFilters 
                    defaultSearch={search}
                    defaultOperation={operation}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <AuditTrailsTable search={search} operation={operation} />
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
                    <AuditFilters 
                      defaultStatus={status}
                    />
                    <Button size="sm">
                      新規タスク
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <WorkflowTasks status={status} />
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
                  {compliance.map((check, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{check.category}</h3>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(check.status)}
                          <span className="text-sm text-muted-foreground">
                            最終チェック: {formatTimestamp(check.lastCheck)}
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
                  {blockchain.blocks.slice(0, 3).map((block, index) => (
                    <div key={block.id} className="relative">
                      <div className="flex items-start space-x-4 p-4 border rounded-lg">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Lock className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">ブロック #{block.id}</h3>
                            {block.verified ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">検証済み</Badge>
                            ) : (
                              <Badge variant="outline">未検証</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">ハッシュ</p>
                              <p className="font-mono text-xs">{block.hash}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">前ブロックハッシュ</p>
                              <p className="font-mono text-xs">{block.prevHash}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">タイムスタンプ</p>
                              <p>{formatTimestamp(block.timestamp)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">操作者</p>
                              <p>{block.actor}</p>
                            </div>
                          </div>
                          <p className="text-sm mt-2">{block.description}</p>
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
                    <span>最終検証: {formatTimestamp(blockchain.lastVerified)}</span>
                    <span>チェーン長: {blockchain.chainLength.toLocaleString()} ブロック</span>
                    <span>整合性: {blockchain.integrity}%</span>
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