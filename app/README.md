ESG Data Hub – 要件定義書（Supabase ✕ OpenAI 版）

ISSB 対応 ESG データを「集める・揃える・証跡まで」自動化する SaaS
DB とストレージは Supabase（Postgres + pgvector / Storage）、
AI 解析は OpenAI API（GPT-4o 系 & Embeddings v3） を核に構築する。

⸻

0. Project Context Sheet（20 項目）

#	項目	内容
①	プロジェクト正式名称	ESG Data Hub
②	開発の背景・起点	2025/3 ISSB 国内指針 → 2027 以降プライム企業で義務化。“統合 ESG データ基盤” は空白領域。
③	最上位目的（KGI）	ESG 資料作成総工数 -50 %以上
④	サブ目標（KPI）	データ収集工数 -80 %／監査指摘率 -50 %
⑤	想定ユーザ	IR 部・経営企画・監査室（計 20–30 名規模）
⑥	利害関係者	監査法人・株主
⑦	解決すべき課題	データ散在、列名バラつき、単位不統一、欠損 KPI、証跡不足
⑧	競合・代替	環境 KPI 特化 SaaS、Excel ワークフロー系ツール
⑨	スコープ範囲	コミット：収集〜監査／ストレッチ：資料出力
⑩	非機能 Top 3	稼働率 ≥ 99.9 %／OpenAI 応答 ≤ 700 ms／RLS 厳格化
⑪	依存・前提	企業がデータ源を把握／監査 Web 閲覧許容
⑫	主要機能	取込ハブ、AI マッピング、単位統一、欠損チェッカー、証跡 WF、API & Dashboard
⑬	既存資産	なし
⑭	成功判定	工数半減 & プライム 33 % へ導入
⑮	技術／インフラ制約	Next.js + Vercel（無料枠）、Supabase、OpenAI
⑯	予算上限	無料枠中心（初期極小）
⑰	タイムライン	3 週間で MVP（BR-01〜05）
⑱	法規・規制	初期は要件洗い出しのみ
⑲	リスク & 対策	※後述
⑳	用語集	ISSB＝国際サステナビリティ基準審議会 etc.


⸻

1. Business Requirements（BR）

1.1 背景 & 機会
	•	市場動向
2025/3：ISSB 国内指針。2027 以降プライム企業は必須。
既存ツールは環境 KPI 特化 or Excel 延命型で 「横断 ESG＋自動マッピング」 が未充足。
	•	業務課題
	1.	データ元が縦割りで収集に数週間
	2.	列名／単位のカオス → 手動統一
	3.	欠損 KPI が監査指摘へ
	4.	証跡・バージョン管理不足
	•	解決機会
LLM による列意味推定・単位変換・欠損判定、RLS＋チェーン履歴で監査コストを半減。

1.2 ゴール体系

レベル	指標	目標値
KGI	ESG 資料作成総工数	-50 % 以上
KPI-1	データ収集工数	-80 %
KPI-2	監査指摘率	-50 %

1.3 ステークホルダ & ペルソナ

役割	関心	主機能
IR 部（主）	期限内に正確な報告書	取込ハブ／マッピング／欠損チェック
経営企画	KPI モニタ	Dashboard／差分ビュー
監査室	証跡確認	WF／チェーン履歴
監査法人	効率レビュー	Web 閲覧／API
株主	透明開示	公開フォーマット出力

1.4 To-Be 業務フロー（概要）
	1.	取込 – CSV / API / Webhook → Supabase Storage
	2.	意味マッピング – OpenAI Embedding + pgvector 近傍検索（≤ 0.5 s/列）
	3.	単位統一 – KPI 定義に基づき自動換算
	4.	欠損チェック – ISSB リスト突合＆Slack アラート
	5.	証跡 WF – 承認・修正履歴をチェーン書込
	6.	監査ビュー – Web 上で差分・出典 URI 確認
	7.	（Stretch）多フォーマット出力 – XBRL / PDF 1 クリック

1.5 ビジネス要求一覧（MoSCoW 抜粋）

優先	BR-ID	要求	背景
Must	BR-01	ESG データ自動集約（CSV/API）	収集工数 -80 %
Must	BR-02	列名＋値から KPI 自動ラベリング	意味統一
Must	BR-03	自動単位換算	データ品質
Must	BR-04	欠損 KPI アラート	指摘率 -50 %
Must	BR-05	ブロックチェーン型証跡	監査要件
Should	BR-06	ベンチマーク分析	開示最適化
Could	BR-07	XBRL オンデマンド	電子提出
Won’t(v1)	BR-10	AI 英文生成	後続フェーズ

1.6 非機能要求（抜粋）

カテゴリ	指標
可用性	稼働率 ≥ 99.9 %
性能	マッピング ≤ 0.5 s/列・Dashboard ≤ 2 s
セキュリティ	ISO 27001 / SOC-2 Type II・Supabase RLS 100 %
コスト	OpenAI 月額上限設定・推論回数キャッシュ
UX	初回オンボーディング ≤ 1 h・NPS +30

1.7 前提 & 制約
	•	Supabase Free/Pro tier で PoC（I/O 上限注意）
	•	OpenAI Embedding & GPT-4o（一部 8k トークン制限）
	•	監査法人が Web 閲覧を受容
	•	MVP は 3 週間、BR-01〜05 を対象

1.8 リスク & 対策

ID	事象	対策
R-01	3 週で証跡チェーン実装が難航	週 2 レビュー＋範囲再交渉
R-02	部門データ欠損／遅延	代替入力フォーム＋アラート
R-03	OpenAI トークン超過	月額予算・ベクトルキャッシュ
R-04	Supabase 上限 I/O 超過	読み取り専用 Replica（Neon）へフェイルオーバ


⸻

2. System Requirements（SR）

2.1 機能要求一覧（FR）

ID	機能	主処理	対応 BR
FR-01	データ取込 IF	CSV/Excel Upload, REST/Webhook, Cron Pull	BR-01
FR-02a	意味マッピング	OpenAI Embedding → pgvector k-NN	BR-02
FR-02b	単位統一	KPI 定義ベースで換算	BR-03
FR-03	欠損チェック	ISSB リスト Δ 検出 → Slack	BR-04
FR-04	証跡 & バージョンチェーン	CRUD をチェーン書込＋RLS	BR-05
FR-05	ベンチマーク分析	外部 DB 組込比較	BR-06
FR-06	XBRL 出力	JSON→XBRL	BR-07

MVP = FR-01〜04

2.2 情報モデル（High-Level ER）
	•	DataSource — 送信元 (部署/AP)
	•	RawRecord — 取込行（原単位・ファイル URI）
	•	KPI — 正規化済み 1 項目 （unit 固定・ISSB tag）
	•	MappingRule — {alias → kpi_id, confidence}
	•	NormRecord — 正規化行（value, unit, kpi_id, src_id）
	•	AuditTrail — {hash, prev_hash, actor, op, ts}
	•	WorkflowTask — 承認状態／担当

2.3 技術選定

ブロック	採用技術	主な理由
取込	@supabase/storage-js, postgrest-js	S3 → Storage 統合
マッピング	openai Node SDK (text-embedding-3-large) + pgvector	高精度 & マネージド
正規化 & 検索	Supabase RPC / Row SQL	運用レス
証跡	Prisma + Supabase RLS + SHA-256 chain	改ざん検出
欠損 Job	Vercel Cron + Supabase Service Key	無料枠
認証	NextAuth.js + Supabase OAuth	RBAC
UI	Next.js (App) + shadcn/ui + TanStack Query	CSR/SSR 最適

2.4 トレーサビリティマトリクス（抜粋）

BR	FR	対応
BR-01	FR-01	✔︎
BR-02	FR-02a,b	✔︎
BR-03	FR-02b	✔︎
BR-04	FR-03	✔︎
BR-05	FR-04	✔︎

2.5 MVP スコープ & マイルストン

週	Deliverable	完了条件
Week 1	取込 + 意味マッピング PoC	CSV → KPI 自動判定（精度 > 80 %）
Week 2	単位統一 + 欠損チェック UI α	Slack 通知 / Dashboard 表示
Week 3	証跡チェーン + Hardening	変更履歴改ざん検知テスト pass


⸻

4. 技術フロー（シーケンス要約）
	1.	Upload → storage.put()
	2.	Raw INSERT → postgrest-js.bulk()
	3.	Embedding → OpenAI → vectors
	4.	k-NN Search → pgvector <-> → kpi_id
	5.	Norm INSERT → Supabase
	6.	Cron → 欠損クエリ → Slack
	7.	UI → Dashboard / Diff view

⸻