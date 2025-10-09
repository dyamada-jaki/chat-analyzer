#!/bin/bash

# SonarQube Docker環境管理スクリプト

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

# SonarQube起動
start_sonarqube() {
    log_info "SonarQube環境を起動しています..."
    
    # Docker Composeで起動
    docker-compose -f docker-compose.sonarqube.yml up -d
    
    log_info "SonarQubeの起動を待機しています..."
    
    # ヘルスチェック
    max_attempts=60
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:9000/api/system/status | grep -q "UP"; then
            log_success "SonarQube が正常に起動しました！"
            log_info "アクセスURL: http://localhost:9000"
            log_info "初期ログイン: admin / admin"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 5
    done
    
    log_error "SonarQubeの起動がタイムアウトしました"
    return 1
}

# SonarQube停止
stop_sonarqube() {
    log_info "SonarQube環境を停止しています..."
    docker-compose -f docker-compose.sonarqube.yml down
    log_success "SonarQube環境を停止しました"
}

# 使用方法
usage() {
    echo "SonarQube Docker環境管理スクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 start    - SonarQubeを起動"
    echo "  $0 stop     - SonarQubeを停止"
    echo ""
    echo "初回起動後のアクセス:"
    echo "  URL: http://localhost:9000"
    echo "  初期ログイン: admin / admin"
}

# メイン処理
case "${1:-}" in
    start)
        start_sonarqube
        ;;
    stop)
        stop_sonarqube
        ;;
    *)
        usage
        exit 1
        ;;
esac
