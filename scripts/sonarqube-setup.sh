#!/bin/bash

# SonarQube 初期設定自動化スクリプト

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

log_warning() {
    echo -e "\033[33m[WARNING]\033[0m $1"
}

# SonarQube起動確認
check_sonarqube() {
    log_info "SonarQubeの起動状態を確認しています..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:9000/api/system/status | grep -q "UP"; then
            log_success "SonarQube が正常に起動しています"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 2
    done
    
    log_error "SonarQubeが起動していません"
    log_info "以下のコマンドでSonarQubeを起動してください:"
    log_info "docker compose -f docker-compose.sonarqube.yml up -d"
    return 1
}

# 手動設定案内
manual_setup_guide() {
    log_info "=== SonarQube 初期設定（手動） ==="
    echo ""
    log_info "1. Web UIアクセス:"
    echo "   URL: http://localhost:9000"
    echo "   初期ログイン: admin / admin"
    echo ""
    log_info "2. パスワード変更:"
    echo "   - 初回ログイン時に新しいパスワードを設定"
    echo ""
    log_info "3. プロジェクト作成:"
    echo "   - 「Create Project」→「Manually」"
    echo "   - Project key: chat-analyzer"
    echo "   - Display name: Chat Analyzer"
    echo ""
    log_info "4. 認証トークン生成:"
    echo "   - 「Locally」→「Generate a token」"
    echo "   - Token name: chat-analyzer-token"
    echo "   - 生成されたトークンをコピー"
    echo ""
    log_info "5. トークン設定:"
    echo "   - sonar-project.properties に追加:"
    echo "   - sonar.login=your_generated_token_here"
    echo ""
    log_info "6. コード解析実行:"
    echo "   - sonar-scanner"
    echo ""
}

# コード解析実行
run_analysis() {
    log_info "コード解析を実行しています..."
    
    if [ ! -f "sonar-project.properties" ]; then
        log_error "sonar-project.properties が見つかりません"
        return 1
    fi
    
    if ! grep -q "sonar.login=" sonar-project.properties; then
        log_warning "認証トークンが設定されていません"
        log_info "手動で設定してから再実行してください"
        return 1
    fi
    
    if command -v sonar-scanner >/dev/null 2>&1; then
        sonar-scanner
        log_success "コード解析が完了しました"
        log_info "結果を確認: http://localhost:9000/dashboard?id=chat-analyzer"
    else
        log_error "sonar-scanner が見つかりません"
        log_info "インストール: brew install sonar-scanner"
        return 1
    fi
}

# メイン処理
main() {
    log_info "SonarQube 初期設定を開始します..."
    
    # SonarQube起動確認
    if ! check_sonarqube; then
        exit 1
    fi
    
    # 手動設定案内
    manual_setup_guide
    
    echo ""
    log_warning "上記の手動設定を完了してから、以下のコマンドでコード解析を実行してください:"
    echo "  $0 analyze"
    echo ""
    log_info "または、設定完了後に 'y' を入力してコード解析を実行できます:"
    read -p "設定は完了しましたか？ (y/N): " response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        run_analysis
    else
        log_info "設定完了後に再実行してください"
    fi
}

# コマンドライン引数処理
case "${1:-}" in
    analyze)
        check_sonarqube && run_analysis
        ;;
    *)
        main
        ;;
esac
