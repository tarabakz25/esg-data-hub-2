import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCheck, Eye, AlertTriangle } from "lucide-react"
import { getWorkflowTasks } from "@/lib/services/audit"
import { WorkflowTask } from "@/lib/types/audit"

interface WorkflowTasksProps {
  status?: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline">待機中</Badge>
    case "approved":
      return <Badge variant="default" className="bg-green-100 text-green-800">承認済み</Badge>
    case "rejected":
      return <Badge variant="destructive">拒否</Badge>
    case "completed":
      return <Badge variant="default" className="bg-green-100 text-green-800">完了</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getPriorityBadge(priority: string) {
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

function getTaskTypeIcon(type: string) {
  switch (type) {
    case "approval":
      return <UserCheck className="h-5 w-5 text-primary" />
    case "review":
      return <Eye className="h-5 w-5 text-primary" />
    case "correction":
      return <AlertTriangle className="h-5 w-5 text-primary" />
    default:
      return <UserCheck className="h-5 w-5 text-primary" />
  }
}

function getTaskTypeTitle(type: string) {
  switch (type) {
    case "approval":
      return "承認タスク"
    case "review":
      return "レビュータスク"
    case "correction":
      return "修正タスク"
    default:
      return type
  }
}

async function WorkflowTasksContent({ status }: WorkflowTasksProps) {
  const tasks = await getWorkflowTasks(status)

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ワークフロータスクが見つかりませんでした
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              {getTaskTypeIcon(task.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold">{getTaskTypeTitle(task.type)}</h3>
                {task.priority && getPriorityBadge(task.priority)}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {task.description || `${task.type}が必要です - レコードID: ${task.record_id}`}
              </p>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>担当: {task.assignee_name || `担当者 ${task.assignee_id.slice(0, 8)}`}</span>
                {task.due_date && <span>期限: {task.due_date}</span>}
                <span>作成: {new Date(task.created_at).toLocaleDateString('ja-JP')}</span>
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
  )
}

function WorkflowTasksLoading() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  )
}

export function WorkflowTasks({ status }: WorkflowTasksProps) {
  return (
    <Suspense fallback={<WorkflowTasksLoading />}>
      <WorkflowTasksContent status={status} />
    </Suspense>
  )
} 