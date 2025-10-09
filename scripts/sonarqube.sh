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
    
    # システム要件チェック
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linuxの場合、vm.max_map_countを設定
        current_max_map_count=$(cat /proc/sys/vm/max_map_count)
        if [ "$current_max_map_count" -lt 262144 ]; then
            log_warning "vm.max_map_count が不足しています。設定を変更します..."
            sudo sysctl -w vm.max_map_count=262144
        fi
    fi
    
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

# ログ表示
show_logs() {
    docker-compose -f docker-compose.sonarqube.yml logs -f sonarqube
}

# 状態確認
status() {
    log_info "SonarQube環境の状態:"
    docker-compose -f docker-compose.sonarqube.yml ps
    
    if curl -s http://localhost:9000/api/system/status >/dev/null 2>&1; then
        log_success "SonarQube API: 正常"
        echo "システム情報:"
        curl -s http://localhost:9000/api/system/status | jq '.' 2>/dev/null || curl -s http://localhost:9000/api/system/status
    else
        log_warning "SonarQube API: 応答なし"
    fi
}

# データリセット
reset() {
    log_warning "全てのSonarQubeデータを削除します。続行しますか？ (y/N)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "SonarQube環境とデータを削除しています..."
        docker-compose -f docker-compose.sonarqube.yml down -v
        docker volume prune -f
        log_success "データリセット完了"
    else
        log_info "キャンセルしました"
    fi
}

# 使用方法
usage() {
    echo "SonarQube Docker環境管理スクリプト"
    echo ""
    echo "使用方法:"
    echo "  $0 start    - SonarQubeを起動"
    echo "  $0 stop     - SonarQubeを停止"
    echo "  $0 restart  - SonarQubeを再起動"
    echo "  $0 logs     - ログを表示"
    echo "  $0 status   - 状態確認"
    echo "  $0 reset    - データリセット"
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
    restart)
        stop_sonarqube
        sleep 3
        start_sonarqube
        ;;
    logs)
        show_logs
        ;;
    status)
        status
        ;;
    reset)
        reset
        ;;
    *)
        usage
        exit 1
        ;;
esac