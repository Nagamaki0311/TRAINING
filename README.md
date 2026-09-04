# TRAINING

個人利用を前提とした、筋力増強・筋肥大に特化したパーソナライズ型トレーニングアプリ。React Native（Expo）でiOS/Android両対応。データは端末内のみに保存し、クラウド同期は行わない。

このリポジトリはAI開発OSテンプレート（project001）から作成したアプリ専用リポジトリであり、開発方針・タスク管理・レビュー手順は引き続きAGENTS.md/REVIEW.md/docs/配下に従う。

## セットアップ

1. `git clone`等でこのリポジトリを取得する。
2. （任意）`bash .claude/bootstrap.sh`を実行し、Optional Dependency（Agent-Reach/Code Review Graph/Context7/GitHub CLI等）の導入状況を確認する。インストールは行わず案内のみを表示する。
3. AGENTS.mdの開発フロー（User → Manager → Planner → Developer → Reviewer → Manager → Complete）に従って進める。

## アプリの起動

```
npm install
npm run start   # Expo Devツールを起動（Expo Goアプリで実機確認、またはi/aでシミュレータ）
npm run typecheck  # tsc --noEmit
```

Expo SDK 57 / React Native / TypeScript。ナビゲーションライブラリは使わず、`src/state/AppState.tsx`の単一状態遷移で画面を切り替える（D-005参照）。永続化はAsyncStorageのみ（クラウド同期なし、D-004参照）。

- `App.tsx`: フォント読み込み・画面切り替え・下部ナビ・設定シートのルート
- `src/theme/`: カラー・フォント・アニメーション秒数などのデザイントークン
- `src/data/`: プロフィール/種目プール/科学的数値基準の型とデータ（docs/training-science.md準拠）
- `src/engine/`: プログラム自動生成・記録ベース自動更新・オーバーワーク判定・レスト通知のロジック
- `src/storage/`: AsyncStorageリポジトリ、PIN・生体認証
- `src/state/AppState.tsx`: グローバル状態（画面遷移・ワークアウトセッション進行）
- `src/screens/`: PIN・ホーム・カテゴリ選択・ワークアウト実行・コンプリート・カレンダーの各画面とUIコンポーネント

デザイン出典は`docs/decisions.md`（旧Claude Design成果物の`Training App プロトタイプ.dc.html`）。設計上の簡略化・逸脱はD-003〜D-007を参照。

## APK/IPAのビルド（EAS Build）

`eas.json`にビルドプロファイルを用意済み。クラウドビルド（[EAS Build](https://docs.expo.dev/build/introduction/)）はExpoアカウントでの認証が必要なため、ローカル環境（または各自のCIアカウント）から実行する。

```
npx eas login                 # 初回のみ。Expoアカウントでログイン（無ければ無料で作成できる）
npx eas build --platform android --profile preview   # APKを直接ビルド（内部配布向け）
```

初回実行時、EASプロジェクトとの紐付け（`app.json`の`extra.eas.projectId`）を対話式で作成するか聞かれる。ビルド完了後、Expo側がAPKのダウンロードリンクを発行する。`production`プロファイルはPlay Store提出向け（AAB形式、`autoIncrement`でバージョン自動採番）。ビルド不要ですぐ実機確認したい場合は`npm run start`でExpo Devサーバを起動し、Expo Goアプリでスキャンする。

## 構成

- AGENTS.md
  - 開発方針・設計原則・ワークフロー（全AIエージェント共通、最優先で読む）

- REVIEW.md
  - レビュー方針（敵対的検証 / Adversarial Review）。reviewer Agentが従う

- CLAUDE.md
  - Claude Code固有の設定・運用ルール（AGENTS.mdをimportする）

- .claude/agents
  - planner / designer / researcher / developer / reviewer

- .claude/skills/design-principles
  - UI/UXデザインの品質判断基準（designer/developer/reviewerが使用）

- .claude/settings.json
  - SessionStart / PreCompact / PostToolUse / SubagentStop / SessionEnd Hook（セッション継続性・ドキュメント品質の補助）、subagentStatusLine（サブエージェント進捗の可視化）、enabledPlugins（Frontend Designをproject scopeで有効化）。詳細はdocs/agents.md・docs/design-workflow.md

- .claude/bootstrap.sh
  - Optional Dependency（Capability Layer）の導入状況を案内のみで表示する検出スクリプト。インストールは行わない

- .claude/commands/init-project.md
  - `/init-project`コマンド。新規プロジェクトでの初期化手順（本READMEの該当節）を実行する

- docs
  - tasks.md: タスクと状態管理
  - progress.md: 作業履歴
  - decisions.md: 設計判断の記録
  - agents.md: Agent構成・モデル構成・Hook/Status Line構成の詳細
  - agent-reach.md: [Agent-Reach](https://github.com/Panniantong/Agent-Reach) 対応（Optional Dependency、検出・フォールバック方針）
  - code-review-graph.md: [Code Review Graph](https://github.com/tirth8205/code-review-graph) 対応（Optional Dependency、影響範囲解析）
  - context7.md: [Context7](https://github.com/upstash/context7) 対応（Optional Dependency、ライブラリドキュメント確認）
  - capability-layer.md: 外部ツール検出の共通規約（Capability Layer）
  - research-workflow.md: 外部調査ワークフロー
  - design-workflow.md: デザインワークフロー（Designer/Claude Design/Frontend Designプラグインの連携）
  - status-line.md: サブエージェント進捗の可視化（Status Line）の仕様

## 開発フロー

User → Manager → Planner → Developer → Reviewer → Manager → Complete
（外部調査が必要な場合のみResearcherが、UI/UX実装を伴う場合のみDesignerが加わる）

詳細は AGENTS.md・REVIEW.md・docs/agents.md・docs/design-workflow.md を参照。
