"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { 
  BarChart3, 
  Upload, 
  Database, 
  AlertTriangle, 
  FileText, 
  Settings,
  Home
} from "lucide-react"

const navigation = [
  {
    name: "ダッシュボード",
    href: "/",
    icon: Home,
    description: "ESGデータの概要と進捗状況"
  },
  {
    name: "データ取込",
    href: "/upload",
    icon: Upload,
    description: "CSV・Excel・APIからのデータ取込"
  },
  {
    name: "データ管理",
    href: "/data",
    icon: Database,
    description: "正規化済みESGデータの管理"
  },
  {
    name: "欠損チェック",
    href: "/missing-kpis",
    icon: AlertTriangle,
    description: "必須KPIの欠損状況確認"
  },
  {
    name: "レポート",
    href: "/reports",
    icon: FileText,
    description: "ISSB準拠レポートの生成"
  },
  {
    name: "監査証跡",
    href: "/audit",
    icon: BarChart3,
    description: "変更履歴とブロックチェーン証跡"
  }
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-5">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              ESG Data Hub
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                  {item.href === "/missing-kpis" && (
                    <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                      3
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* モバイル用ナビゲーション */}
            <NavigationMenu className="md:hidden">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>メニュー</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-4 w-[300px]">
                      {navigation.map((item) => {
                        const Icon = item.icon
                        return (
                          <NavigationMenuLink key={item.href} asChild>
                            <Link
                              href={item.href}
                              className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            >
                              <div className="flex items-center space-x-2">
                                <Icon className="h-4 w-4" />
                                <div className="text-sm font-medium leading-none">
                                  {item.name}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {item.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        )
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
              <span className="sr-only">設定</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
} 