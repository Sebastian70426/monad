/* Monad 日本語辞書 */
window.I18N_DICTS = window.I18N_DICTS || {};
window.I18N_DICTS.ja = {
  "nav": {
    "study": "学習", "ai": "AI",
    "dashboard": "ダッシュボード", "courses": "コース", "tutor": "AIチューター",
    "knowledge": "ナレッジベース", "review": "復習", "settings": "設定",
    "tagline": "AI学習パートナー"
  },
  "topbar": { "modelReady": "モデル準備完了 · {provider}" },
  "aisub": { "newChat": "新しい会話", "history": "履歴", "context": "コンテキスト/コース" },
  "pop": {
    "historyTitle": "会話履歴", "contextTitle": "質問範囲を選択",
    "loading": "読み込み中...", "noSessions": "会話履歴はありません",
    "noCourses": "コースがまだありません", "globalKB": "🌍 グローバルナレッジベース", "chatNo": "会話 #{id}"
  },
  "cmd": {
    "section": "操作",
    "upload": "新しい録音をアップロード", "uploadHint": "音声→テキスト→ AIノート",
    "wake": "AIチューターを起動", "wakeHint": "コースとナレッジベースからQ&A",
    "review": "復習を開始", "reviewHint": "SM-2 間隔反復",
    "courses": "コースを開く", "coursesHint": "コース一覧",
    "dashboard": "ダッシュボードへ", "dashboardHint": "今日の概要",
    "settings": "設定を開く", "settingsHint": "APIキーとモデル",
    "noMatch": "一致するコマンドがありません"
  },
  "chat": {
    "createFail": "会話の作成に失敗: {err}", "unknown": "不明なエラー",
    "thinking": "✦ AIが考えています...", "noReply": "（返信なし）",
    "imageTag": "[画像]", "noVision": "現在のモデルは画像に対応していません。OpenAI / Gemini のマルチモーダルモデルに切り替えてください。",
    "attachImage": "画像を追加", "imageTooLarge": "画像が大きすぎます（8MB超）", "imageLimit": "1メッセージにつき最大3枚まで"
  },
  "idx": {
    "indexing": "インデックス作成中…",
    "done": "✅ インデックス完了（{count} chunks）",
    "noKey": "❌ モデルAPIキー未設定のためスキップ",
    "fail": "❌ インデックス失敗: {err}"
  },
  "dash": {
    "greetNight": "遅くまでお疲れさま、{name}。", "greetMorning": "おはようございます、{name}。",
    "greetAfternoon": "こんにちは、{name}。", "greetEvening": "こんばんは、{name}。",
    "hero": "今日も学習を始めましょう！", "heroSub": "今日のAI学習プランが準備できました",
    "progress": "学習進捗", "review": "今日の復習", "ai": "AIおすすめタスク",
    "trendSm2": "SM-2", "trendAi": "AI",
    "continue": "学習を続ける", "plan": "今日のAIプラン", "memory": "学習メモリー", "loading": "読み込み中...",
    "progressUnit": "コース受講中", "reviewUnit": "件の復習予定", "aiUnit": "件のノート未生成",
    "createdAt": "{time} 作成", "noCourses": "コースがありません。最初のコースを作成しましょう",
    "planEmpty": "コースとクイズを完了すると、AIがパーソナライズしたプランを生成します",
    "memoryEmpty": "まだ知識がありません。最初の授業録音を分析しましょう"
  },
  "crs": {
    "subtitle": "すべてのコースを管理", "newCourse": "新規コース",
    "loading": "読み込み中...", "emptyTitle": "コースがまだありません",
    "emptySub": "最初のコースを作成して学習を始めましょう", "create": "コースを作成",
    "createdAt": "{time} 作成", "enter": "開く →", "more": "その他の操作",
    "namePrompt": "コース名（例：材料力学）", "createFail": "作成に失敗しました",
    "menuSettings": "コース設定", "comingSoon": "コース設定は近日公開",
    "rename": "コース名を変更", "archive": "コースをアーカイブ", "delete": "コースを削除",
    "renamePrompt": "コース名を変更：", "renameFail": "名前の変更に失敗しました",
    "archiveTitle": "コースをアーカイブ",
    "archiveMsg": "アーカイブ後、コースはホームから非表示になりますが、ノート・資料・会話はすべて保持されます。今後のバージョンで復元できます。",
    "archiveBtn": "アーカイブ",
    "deleteTitle": "コースを削除",
    "deleteMsg": "コース「{name}」を削除しますか？\n\nこのコースのすべての授業記録・資料・AI会話・クイズも削除されます。この操作は元に戻せません。",
    "deleteBtn": "削除する", "deleteErr": "削除に失敗: {err}",
    "confirm": "確認"
  },
  "cr": {
    "meta": "授業記録 · 資料 · AIチューター",
    "lectures": "授業記録", "upload": "🎤 録音をアップロード", "docs": "資料",
    "tutorHint": "· このコースの資料に基づいて対話", "tutorPlaceholder": "このコースについて質問...",
    "inputPlaceholder": "質問を入力...",
    "noLectures": "授業記録がまだありません。右上から最初の録音をアップロード",
    "hasNote": "ノート生成済み", "note": "📝 ノート", "export": "エクスポート",
    "noDocs": "資料がまだありません。ナレッジベースでPDF/PPT/画像をアップロード",
    "transcript": "元の文字起こし", "currentLecture": "現在の授業 · {title}",
    "noNote": "この授業記録にはまだノートがありません", "genNote": "AIノートを生成", "generating": "生成中...",
    "transcribeFail": "文字起こしに失敗: {err}"
  },
  "tut": {
    "hero": "今日は何を探求しますか？",
    "heroSub": "コース、概念、問題から始めましょう — AIチューターがいつでも待機しています",
    "placeholder": "質問を入力...",
    "chipSimplify": "簡潔に", "chipExample": "例題", "chipQuiz": "出題", "chipAnalogy": "類推",
    "globalKB": "🌍 グローバルナレッジベース", "courseLabel": "📚 {name}",
    "newChat": "New Chat", "noSessions": "会話がありません"
  },
  "kb": {
    "title": "ナレッジベース", "subtitle": "コース資料 + RAGベクトル索引",
    "allCourses": "すべてのコース", "upload": "アップロード",
    "search": "ファイル名または内容を検索（セマンティック検索対応）...",
    "colFilename": "ファイル名", "colCourse": "コース", "colTime": "アップロード日時",
    "colSize": "サイズ", "colIndex": "索引", "colActions": "操作",
    "emptyTitle": "一致するファイルがありません",
    "emptySub": "右上の「資料をアップロード」から PDF / PPT / TXT / 画像 を追加",
    "uploading": "{name} をアップロード中 ...",
    "uploadOk": "✅ アップロード完了、バックグラウンドで索引作成中…", "uploadErr": "❌ {err}",
    "pickTitle": "アップロード先のコースを選択", "pickFirst": "先にコースを作成してください", "cancel": "キャンセル",
    "deleteConfirm": "このドキュメントとベクトル索引を削除しますか？",
    "reindexing": "再インデックス中…", "reindexBtn": "再索引",
    "reindexDone": "✅ インデックス完了（{count} chunks）", "reindexFail": "❌ {err}",
    "notIndexed": "未索引", "indexed": "{count} chunks",
    "semHit": "セマンティック", "fnHit": "ファイル名",
    "visionExtracting": "ビジョンモデルで画像の文字を抽出中…", "noVisionDoc": "現在のモデルは画像に対応していません。OpenAI / Gemini に切り替えてから画像ドキュメントをアップロードしてください。"
  },
  "rv": {
    "title": "復習", "subtitle": "SM-2 間隔反復 · 知識を長期記憶へ",
    "dueToday": "今日の復習", "totalBank": "問題バンク", "mastery": "習得率",
    "selectCourse": "コースを選択", "genQuiz": "クイズ生成", "startReview": "復習開始",
    "generating": "クイズを生成中...", "generated": "{count} 問生成しました",
    "pickFirst": "先にコースを選択してください", "noneDue": "今日は復習する問題がありません",
    "questionNo": "第 {i} / {n} 問",
    "fillPlaceholder": "答えを入力...", "submit": "提出",
    "rateLabel": "理解度は？", "forget": "忘れた", "fuzzy": "曖昧", "remember": "覚えていた",
    "correct": "✅ 正解", "wrong": "❌ 不正解", "answer": "正解: {ans}",
    "summaryCorrect": "{c} / {n} 問正解",
    "summaryRate": "正解率 {pct}% · 復習スケジュールを更新しました"
  },
  "st": {
    "title": "設定", "subtitle": "APIキー · モデルプロバイダー · 言語",
    "langLabel": "表示言語", "zh": "简体中文", "en": "English", "ja": "日本語",
    "providerLabel": "AIモデルプロバイダー",
    "pDeepseek": "DeepSeek", "pOpenai": "OpenAI (ChatGPT)", "pGroq": "Groq", "pGemini": "Google Gemini",
    "keyPlaceholder": "APIキーを入力", "test": "テスト", "testing": "テスト中...",
    "connected": "✅ 接続成功", "failed": "❌ 接続失敗",
    "save": "設定を保存", "saved": "✅ 保存しました",
    "keyDeepseek": "DeepSeek APIキー", "keyOpenai": "OpenAI APIキー", "keyGemini": "Gemini APIキー", "keyGroq": "Groq APIキー",
    "llmCard": "AIモデル · LLM", "transcribeCard": "音声認識 · Groq Whisper",
    "groqNote": "Groqのキーは音声認識とGroqテキストモデルの両方に使用されます",
    "visionNote": "OpenAI と Gemini はマルチモーダル（画像理解）対応。DeepSeek と Groq はテキストのみ",
    "modelStatus": "モデルステータス"
  },
  "splash": {
    "sub": "Initializing AI Engine",
    "model": "AI Model", "kb": "Knowledge Base", "memory": "Learning Memory",
    "welcome": "Welcome back, {name}"
  }
};
