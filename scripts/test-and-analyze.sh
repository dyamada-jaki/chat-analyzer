#!/bin/bash

# テストカバレッジ付きSonarQube解析スクリプト

set -e

# 色付きログ関数
log_info() {
    echo -e "\033[36m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# Step 1: バックエンドテスト（カバレッジ付き）実行
run_backend_tests() {
    log_info "バックエンドテスト（カバレッジ付き）を実行しています..."
    
    cd backend
    pnpm test:coverage
    cd ..
    
    # カバレッジファイルの存在確認
    if [ -f "backend/coverage/lcov.info" ]; then
        log_success "カバレッジレポート生成完了: backend/coverage/lcov.info"
    else
        log_error "カバレッジレポートが見つかりません"
        return 1
    fi
}

# Step 2: SonarQube解析実行
run_sonarqube_analysis() {
    log_info "SonarQube解析を実行しています..."
    
    # Java環境設定
    export JAVA_HOME=/usr/local/Cellar/openjdk/25
    export PATH="/usr/local/Cellar/openjdk/25/bin:$PATH"
    
    # SonarQube Scanner実行
    sonar-scanner
    
    log_success "SonarQube解析完了"
    log_info "結果を確認: http://localhost:9000/dashboard?id=chat-analyzer"
}

# Step 3: カバレッジサマリー表示
show_coverage_summary() {
    log_info "カバレッジサマリー:"
    
    if [ -f "backend/coverage/coverage-final.json" ]; then
        # Node.js用のカバレッジサマリー表示（簡易版）
        echo "詳細なカバレッジレポート: backend/coverage/index.html"
        
        # ブラウザでカバレッジレポートを開く（オプション）
        read -p "カバレッジレポートをブラウザで開きますか？ (y/N): " response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            open backend/coverage/index.html
        fi
    fi
}

# メイン実行
main() {
    log_info "テストカバレッジ付きSonarQube解析を開始します..."
    
    # SonarQube起動確認
    if ! curl -s http://localhost:9000/api/system/status | grep -q "UP"; then
        log_error "SonarQubeが起動していません"
        log_info "以下のコマンドでSonarQubeを起動してください:"
        log_info "docker compose -f docker-compose.sonarqube.yml up -d"
        return 1
    fi
    
    # バックエンドテスト実行
    run_backend_tests
    
    # SonarQube解析実行
    run_sonarqube_analysis
    
    # カバレッジサマリー表示
    show_coverage_summary
    
    log_success "全ての処理が完了しました！"
}

# エラーハンドリング
trap 'log_error "スクリプト実行中にエラーが発生しました"; exit 1' ERR

# メイン実行
main "$@"
