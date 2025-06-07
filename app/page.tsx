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
  Clock,
  Shield
} from "lucide-react"
import { DashboardData } from "@/lib/types"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      <main className="container mx-auto py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <BarChart3 className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            ESG Data Hub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            企業のESG（環境・社会・ガバナンス）データを効率的に管理・分析するための統合プラットフォーム
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/auth/login">
                今すぐ始める
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="#features">
                機能を見る
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">主な機能</h2>
            <p className="text-muted-foreground mt-2">
              ESGデータ管理に必要な機能を包括的に提供
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Upload className="h-8 w-8 text-blue-600" />
                <CardTitle>データ取込</CardTitle>
                <CardDescription>
                  CSV、Excel、JSONファイルから簡単にESGデータを取込
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 複数ファイル形式対応</li>
                  <li>• バッチアップロード</li>
                  <li>• データ検証機能</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-8 w-8 text-green-600" />
                <CardTitle>データ管理</CardTitle>
                <CardDescription>
                  正規化されたESGデータの一元管理
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• データ品質管理</li>
                  <li>• 履歴管理</li>
                  <li>• メタデータ管理</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <CardTitle>分析・レポート</CardTitle>
                <CardDescription>
                  ESGパフォーマンスの可視化と分析
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• インタラクティブダッシュボード</li>
                  <li>• カスタムレポート</li>
                  <li>• トレンド分析</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 bg-blue-50 rounded-lg p-8">
          <h2 className="text-3xl font-bold tracking-tight">
            ESGデータ管理を始めましょう
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            アカウントを作成して、今すぐESGデータの効率的な管理を開始できます
          </p>
          <Button asChild size="lg">
            <Link href="/auth/login">
              <Shield className="mr-2 h-4 w-4" />
              アカウント作成
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50">
        <div className="container mx-auto py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ESG Data Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
