"use client"

import { useState, useCallback } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Navigation } from "@/components/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  Database,
  Loader2,
  ArrowRight,
  BarChart3,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"

interface UploadFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: any
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [dataSourceId, setDataSourceId] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const { user, isLoading } = useAuth()
  const supabase = createClient()

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleFiles = (fileList: File[]) => {
    console.log('Adding files:', fileList.map(f => f.name))
    const newFiles: UploadFile[] = fileList.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending',
      progress: 0
    }))
    console.log('New files created:', newFiles)
    setFiles(prev => {
      const updated = [...prev, ...newFiles]
      console.log('Updated files state:', updated)
      return updated
    })
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id))
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    console.log('Starting upload for file:', uploadFile.file.name, 'Data source:', dataSourceId)
    
    if (!user) {
      console.error('User not authenticated')
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: 'ログインが必要です' }
          : f
      ))
      return
    }
    
    if (!dataSourceId) {
      console.error('No data source selected')
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: 'データソースを選択してください' }
          : f
      ))
      return
    }

    console.log('Setting file status to uploading')
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'uploading', progress: 0 }
        : f
    ))

    const formData = new FormData()
    formData.append('file', uploadFile.file)
    formData.append('data_source_id', dataSourceId)

    console.log('Sending request to /api/upload')

    try {
      // Get the current session to verify authentication
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session:', session)

      if (!session) {
        throw new Error('No active session')
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (response.ok) {
        const result = await response.json()
        console.log('Upload successful:', result)
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'success', progress: 100, result }
            : f
        ))
      } else {
        const errorText = await response.text()
        console.error('Upload failed with status:', response.status, 'Error:', errorText)
        let error
        try {
          error = JSON.parse(errorText)
        } catch {
          error = { error: errorText || 'アップロードに失敗しました' }
        }
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, status: 'error', error: error.error || 'アップロードに失敗しました' }
            : f
        ))
      }
    } catch (error) {
      console.error('Network error during upload:', error)
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: 'ネットワークエラーが発生しました: ' + (error as Error).message }
          : f
      ))
    }
  }

  const uploadAllFiles = async () => {
    console.log('Starting upload all files')
    console.log('Current files:', files)
    console.log('Data source ID:', dataSourceId)
    
    setIsUploading(true)
    const pendingFiles = files.filter(f => f.status === 'pending')
    console.log('Pending files to upload:', pendingFiles.length)
    
    if (pendingFiles.length === 0) {
      console.log('No pending files to upload')
      setIsUploading(false)
      return
    }
    
    for (const file of pendingFiles) {
      console.log('Uploading file:', file.file.name)
      await uploadFile(file)
    }
    
    console.log('All uploads completed')
    setIsUploading(false)
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-muted-foreground" />
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">待機中</Badge>
      case 'uploading':
        return <Badge variant="default">アップロード中</Badge>
      case 'success':
        return <Badge variant="default" className="bg-green-500">完了</Badge>
      case 'error':
        return <Badge variant="destructive">エラー</Badge>
    }
  }

  // Check if all files are successfully uploaded
  const allFilesUploaded = files.length > 0 && files.every(f => f.status === 'success')
  const successfulUploads = files.filter(f => f.status === 'success').length

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto py-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">読み込み中...</span>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <main className="container mx-auto py-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ファイルをアップロードするにはログインが必要です。
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto py-6 space-y-6 px-5">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">データ取込</h1>
          <p className="text-muted-foreground">
            CSV、Excel、JSONファイルからESGデータを取込・処理します
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* アップロード設定 */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>アップロード設定</CardTitle>
                <CardDescription>
                  データソースと取込設定を選択してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="data-source">データソース</Label>
                  <Select value={dataSourceId} onValueChange={(value) => {
                    console.log('Data source selected:', value)
                    setDataSourceId(value)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="データソースを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="11111111-1111-1111-1111-111111111111">人事部</SelectItem>
                      <SelectItem value="22222222-2222-2222-2222-222222222222">財務部</SelectItem>
                      <SelectItem value="33333333-3333-3333-3333-333333333333">事業部</SelectItem>
                      <SelectItem value="44444444-4444-4444-4444-444444444444">サステナビリティ部</SelectItem>
                      <SelectItem value="55555555-5555-5555-5555-555555555555">外部API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">説明（任意）</Label>
                  <Textarea 
                    id="description"
                    placeholder="このデータの説明や注意事項を入力..."
                    className="min-h-[80px]"
                  />
                </div>

                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    対応形式: CSV, Excel (.xlsx), JSON<br/>
                    最大ファイルサイズ: 10MB
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* アップロード統計 */}
            <Card>
              <CardHeader>
                <CardTitle>アップロード統計</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">総ファイル数</span>
                    <div className="text-2xl font-bold">{files.length}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">完了</span>
                    <div className="text-2xl font-bold text-green-500">
                      {files.filter(f => f.status === 'success').length}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">エラー</span>
                    <div className="text-2xl font-bold text-red-500">
                      {files.filter(f => f.status === 'error').length}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">待機中</span>
                    <div className="text-2xl font-bold text-blue-500">
                      {files.filter(f => f.status === 'pending').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ファイルアップロード */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>ファイル選択</CardTitle>
                <CardDescription>
                  ファイルをドラッグ&ドロップするか、クリックして選択してください
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      ファイルをここにドロップ
                    </p>
                    <p className="text-sm text-muted-foreground">
                      または
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      ファイルを選択
                    </Button>
                    <Input
                      id="file-input"
                      type="file"
                      multiple
                      accept=".csv,.xlsx,.json"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFiles(Array.from(e.target.files))
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ファイル一覧 */}
            {files.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>アップロードファイル</CardTitle>
                    <CardDescription>
                      選択されたファイルの一覧と処理状況
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFiles([])}
                      disabled={isUploading}
                    >
                      すべてクリア
                    </Button>
                    <Button
                      onClick={() => {
                        console.log('Upload button clicked')
                        console.log('Button disabled conditions:', {
                          isUploading,
                          dataSourceId: !!dataSourceId,
                          pendingFiles: files.filter(f => f.status === 'pending').length
                        })
                        uploadAllFiles()
                      }}
                      disabled={isUploading || !user || !dataSourceId || files.filter(f => f.status === 'pending').length === 0}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          アップロード中
                        </>
                      ) : (
                        'すべてアップロード'
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {files.map((uploadFile) => (
                      <div
                        key={uploadFile.id}
                        className="flex items-center space-x-4 p-3 border rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          {getStatusIcon(uploadFile.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {uploadFile.file.name}
                            </p>
                            {getStatusBadge(uploadFile.status)}
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-xs text-muted-foreground">
                              {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            {uploadFile.result && (
                              <p className="text-xs text-muted-foreground">
                                {uploadFile.result.processed_rows} 行処理
                              </p>
                            )}
                          </div>
                          
                          {uploadFile.status === 'uploading' && (
                            <Progress value={uploadFile.progress} className="mt-2 h-1" />
                          )}
                          
                          {uploadFile.error && (
                            <p className="text-xs text-red-500 mt-1">
                              {uploadFile.error}
                            </p>
                          )}
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(uploadFile.id)}
                          disabled={uploadFile.status === 'uploading'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 成功メッセージとNext Steps */}
            {allFilesUploaded && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-800">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    アップロード完了
                  </CardTitle>
                  <CardDescription className="text-green-700">
                    {successfulUploads}個のファイルが正常にアップロードされました。次のステップに進んでください。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">データ管理</p>
                          <p className="text-sm text-muted-foreground">アップロードされたデータの確認と品質チェック</p>
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href="/data">
                          確認する
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">欠損チェック</p>
                          <p className="text-sm text-muted-foreground">必須KPIの欠損状況を確認</p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/missing-kpis">
                          チェックする
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                  
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertDescription>
                      <strong>推奨フロー:</strong> データ管理 → 欠損チェック → レポート生成 → 監査証跡の順で進めることをお勧めします。
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 