"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, Filter, Download } from "lucide-react"

interface AuditFiltersProps {
  onSearchChange?: (search: string) => void
  onOperationChange?: (operation: string) => void
  onStatusChange?: (status: string) => void
  defaultSearch?: string
  defaultOperation?: string
  defaultStatus?: string
}

export function AuditFilters({
  onSearchChange,
  onOperationChange,
  onStatusChange,
  defaultSearch = "",
  defaultOperation = "all",
  defaultStatus = "all"
}: AuditFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || defaultSearch)
  const [selectedOperation, setSelectedOperation] = useState(searchParams.get('operation') || defaultOperation)
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || defaultStatus)

  const updateURL = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    startTransition(() => {
      router.push(`?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    onSearchChange?.(value)
    updateURL({ search: value, operation: selectedOperation, status: selectedStatus })
  }

  const handleOperationChange = (value: string) => {
    setSelectedOperation(value)
    onOperationChange?.(value)
    updateURL({ search: searchTerm, operation: value, status: selectedStatus })
  }

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value)
    onStatusChange?.(value)
    updateURL({ search: searchTerm, operation: selectedOperation, status: value })
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export audit data')
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="記録を検索..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-64"
            disabled={isPending}
          />
        </div>
        
        <Select value={selectedOperation} onValueChange={handleOperationChange} disabled={isPending}>
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

        <Select value={selectedStatus} onValueChange={handleStatusChange} disabled={isPending}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全て</SelectItem>
            <SelectItem value="pending">待機中</SelectItem>
            <SelectItem value="approved">承認済み</SelectItem>
            <SelectItem value="rejected">拒否</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isPending}>
          <Download className="h-4 w-4 mr-2" />
          エクスポート
        </Button>
      </div>
    </div>
  )
} 