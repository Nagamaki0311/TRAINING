# タスク管理

現在のタスク、優先順位、状態を管理する。

## 状態の定義

- `未着手`: まだ着手していない
- `計画中`: plannerによる計画作成中/完了
- `調査中`: researcherによる外部情報収集中（外部調査が必要なタスクのみ）
- `実装中`: developerによる実装中
- `レビュー中`: reviewerによる確認中
- `完了`: 完了条件（AGENTS.md参照）を満たした

## タスク一覧

| ID | タスク | 優先度 | 状態 | 担当エージェント | 備考 |
|----|--------|--------|------|------------------|------|
| T-001 | project001テンプレートをTRAININGアプリ専用リポジトリへ転用 | 高 | 完了 | claude | README.mdの初期化手順に従い、docs/tasks.md・progress.md・decisions.mdのproject001構築履歴をリセット。README.mdをアプリ概要に書き換え（D-001参照） |
| T-002 | トレーニング科学リサーチ（工程1） | 高 | 完了 | claude | ボリュームランドマーク・頻度・自重種目の漸進的過負荷・疲労/ディロード・オーバーワーク判定閾値をdocs/training-science.mdに集約（D-002参照） |
| T-003 | データモデル・種目プール設計 | 高 | 完了 | claude | src/data配下にProfile/ExerciseDef/ProgramDay/SessionRecord等の型、4カテゴリ×5〜7種目の種目プール、docs/training-science.md準拠のscienceDefaults.tsを実装 |
| T-004 | Expo RNアプリ基盤構築 | 高 | 完了 | claude | create-expo-app(blank-typescript)からTRAININGリポジトリへ移植、依存パッケージ（async-storage/local-authentication/secure-store/notifications/svg/safe-area-context等）を導入、app.json/package.jsonを更新 |
| T-005 | 画面実装 | 高 | 完了 | claude | PIN/ホーム/カテゴリ選択/ワークアウト実行(work・rest・HOW TOシート)/コンプリート/カレンダーの6画面とBottomNav/CapacityGauge/RestRing/HowToSheet/FlashOverlay/SettingsSheetを実装。clip-path等CSS専用表現は簡略化（D-007参照） |
| T-006 | プログラム生成・自動更新・オーバーワーク判定ロジック | 高 | 完了 | claude | programGenerator.ts（週間プラン・初期プログラム生成）・progression.ts（漸進的過負荷・疲労/体調補正・ディロード提案）・capacity.ts（3軸オーバーワーク判定）を実装しAppStateへ結線。自己レビューでgenerateWeekPlanの日数バグを発見・修正 |
| T-007 | 永続化・PIN認証・タイマー | 高 | 完了 | claude | db.ts（AsyncStorage）・auth.ts（SHA-256+SecureStore PIN、expo-local-authentication生体認証）・timer.ts（タイムスタンプベースのレスト通知）を実装（D-004参照） |
| T-008 | 敵対的レビュー・仕上げ | 高 | 完了 | general-purpose（reviewer代替） | High2件（最終セット完了時の競合状態）・Medium2件（日付ソートcomparator・永続化エラーハンドリング）をCONFIRMED/PLAUSIBLEで検出、全件修正（D-008参照）。修正後`npx tsc --noEmit`・`expo export --platform ios`で再検証済み |

## バックログ（未着手・優先度未確定）

- （ここに新しいタスク候補を追記する）

## メモ

- 新しいタスクを追加したら、必ず優先度と状態を設定すること。
- タスクの状態が変わったら都度このファイルを更新する（作業完了後にまとめて更新しない）。
- 詳細な作業内容や経緯は [progress.md](./progress.md) を参照。
- 設計上の判断が必要になった場合は [decisions.md](./decisions.md) に記録する。
- **状態列の値は必ず「状態の定義」にある6値を完全一致（前後の空白のみ許容）で使うこと**。SessionStart Hookの完了タスクフィルタ（`.claude/settings.json`）が状態列の完全一致で判定しているため、`完了(要再確認)`のような接尾辞付きの値は「未完了」として扱われる（安全側だが、フィルタが効かなくなる）。既知の制約としてT-011のレビューループで確認済み（docs/progress.md参照）。
- **タスク名・備考欄に未エスケープの`|`を含めないこと**。SessionStart Hookは`docs/tasks.md`を`awk -F'|'`で列分割しており、セル内に`|`があると以降の列がずれる。Markdownテーブルとしても不正な記法になるため、通常の運用では発生しない想定。
