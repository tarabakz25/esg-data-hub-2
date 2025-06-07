import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            認証エラー
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            認証プロセスでエラーが発生しました
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              認証に失敗しました
            </CardTitle>
            <CardDescription>
              メール認証リンクが無効または期限切れです
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                認証コードが無効です。新しい認証メールをリクエストしてください。
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                以下の手順をお試しください：
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>メールの認証リンクが最新のものか確認してください</li>
                <li>リンクをクリックしてから時間が経っていないか確認してください</li>
                <li>新しいアカウントを作成してみてください</li>
              </ul>
            </div>

            <div className="flex flex-col space-y-2">
              <Button asChild>
                <Link href="/auth/login">
                  ログインページに戻る
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  ホームに戻る
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 