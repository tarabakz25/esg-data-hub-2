import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ComplianceCheck } from "@/lib/types/audit"

interface ComplianceChecksProps {
  compliance: ComplianceCheck[]
}

function getStatusBadge(status: string) {
  switch (status) {
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

export function ComplianceChecks({ compliance }: ComplianceChecksProps) {
  if (compliance.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        コンプライアンスデータが見つかりませんでした
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {compliance.map((check, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{check.category}</h3>
            <div className="flex items-center space-x-2">
              {getStatusBadge(check.status)}
              <span className="text-sm text-muted-foreground">
                最終チェック: {check.last_check}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>スコア</span>
              <span className="font-medium">{check.score}%</span>
            </div>
            <Progress value={check.score} className="h-2" />
          </div>
          
          {check.requirements && check.requirements.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground">要件:</h4>
              <ul className="text-sm space-y-1">
                {check.requirements.map((req, reqIndex) => (
                  <li key={reqIndex} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {check.issues && check.issues.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-destructive">課題:</h4>
              <ul className="text-sm space-y-1">
                {check.issues.map((issue, issueIndex) => (
                  <li key={issueIndex} className="flex items-center space-x-2 text-destructive">
                    <span className="w-1.5 h-1.5 bg-destructive rounded-full" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  )
} 