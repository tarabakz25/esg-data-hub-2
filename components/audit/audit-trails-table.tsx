import { Suspense } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Eye, Hash, User } from "lucide-react"
import { getAuditTrails } from "@/lib/services/audit"
import { AuditTrail } from "@/lib/types/audit"

interface AuditTrailsTableProps {
  search?: string
  operation?: string
}

function getOperationBadge(operation: string) {
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

async function AuditTrailsContent({ search, operation }: AuditTrailsTableProps) {
  const auditTrails = await getAuditTrails(search, operation)

  if (auditTrails.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        監査証跡が見つかりませんでした
      </div>
    )
  }

  return (
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
        {auditTrails.map((trail) => (
          <TableRow key={trail.id}>
            <TableCell>{getOperationBadge(trail.operation)}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium">{trail.record_type || 'データ'}</p>
                <p className="text-sm text-muted-foreground">{trail.record_id}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{trail.actor_name || `ユーザー ${trail.actor_id.slice(0, 8)}`}</span>
              </div>
            </TableCell>
            <TableCell>{formatTimestamp(trail.timestamp)}</TableCell>
            <TableCell>
              <div className="flex items-center space-x-2">
                <Hash className="h-3 w-3" />
                <span className="font-mono text-xs">{trail.hash.slice(0, 12)}...</span>
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
  )
}

function AuditTrailsLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
      ))}
    </div>
  )
}

export function AuditTrailsTable({ search, operation }: AuditTrailsTableProps) {
  return (
    <Suspense fallback={<AuditTrailsLoading />}>
      <AuditTrailsContent search={search} operation={operation} />
    </Suspense>
  )
} 