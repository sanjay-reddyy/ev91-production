#!/bin/bash

# EV91 Platform - Spare Parts Service Management Script
# This script manages Docker operations for the spare-parts-service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.spare-parts.yml"
SERVICE_NAME="spare-parts-service"
ENV_FILE="$SCRIPT_DIR/.env"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Load environment variables
load_env() {
    if [[ -f "$ENV_FILE" ]]; then
        log_info "Loading environment variables from $ENV_FILE"
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    else
        log_warning "Environment file not found: $ENV_FILE"
        log_info "Using default environment variables"
    fi
}

# Show usage information
show_usage() {
    echo "EV91 Platform - Spare Parts Service Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start           Start the spare-parts-service and dependencies"
    echo "  stop            Stop the spare-parts-service"
    echo "  restart         Restart the spare-parts-service"
    echo "  build           Build the spare-parts-service Docker image"
    echo "  rebuild         Rebuild and restart the spare-parts-service"
    echo "  status          Show status of all services"
    echo "  logs            Show logs from spare-parts-service"
    echo "  shell           Open shell in spare-parts-service container"
    echo "  db-setup        Initialize the database"
    echo "  db-migrate      Run database migrations"
    echo "  db-seed         Seed the database with sample data"
    echo "  health          Check health of spare-parts-service"
    echo "  clean           Stop and remove all containers and volumes"
    echo "  dev             Start in development mode with hot reload"
    echo "  prod            Start in production mode"
    echo ""
    echo "Options:"
    echo "  -f, --follow    Follow logs output (for logs command)"
    echo "  -h, --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start        # Start spare-parts service"
    echo "  $0 logs -f      # Follow logs"
    echo "  $0 db-setup     # Initialize database"
}

# Start services
start_services() {
    log_info "Starting spare-parts-service and dependencies..."
    check_docker
    check_docker_compose
    load_env
    
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services started successfully!"
    log_info "Spare Parts Service: http://localhost:4006"
    log_info "API Gateway: http://localhost:8000"
    log_info "Database: localhost:5432"
    log_info "Redis: localhost:6379"
}

# Stop services
stop_services() {
    log_info "Stopping spare-parts-service..."
    docker-compose -f "$COMPOSE_FILE" stop "$SERVICE_NAME"
    log_success "Spare-parts-service stopped!"
}

# Restart services
restart_services() {
    log_info "Restarting spare-parts-service..."
    docker-compose -f "$COMPOSE_FILE" restart "$SERVICE_NAME"
    log_success "Spare-parts-service restarted!"
}

# Build services
build_services() {
    log_info "Building spare-parts-service Docker image..."
    docker-compose -f "$COMPOSE_FILE" build "$SERVICE_NAME"
    log_success "Build completed!"
}

# Rebuild and restart
rebuild_services() {
    log_info "Rebuilding and restarting spare-parts-service..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache "$SERVICE_NAME"
    docker-compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
    log_success "Rebuild and restart completed!"
}

# Show status
show_status() {
    log_info "Service Status:"
    docker-compose -f "$COMPOSE_FILE" ps
}

# Show logs
show_logs() {
    local follow_flag=""
    if [[ "$1" == "-f" || "$1" == "--follow" ]]; then
        follow_flag="-f"
    fi
    
    log_info "Showing logs for spare-parts-service..."
    docker-compose -f "$COMPOSE_FILE" logs $follow_flag "$SERVICE_NAME"
}

# Open shell
open_shell() {
    log_info "Opening shell in spare-parts-service container..."
    docker-compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" /bin/sh
}

# Database setup
setup_database() {
    log_info "Setting up database for spare-parts-service..."
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    docker-compose -f "$COMPOSE_FILE" exec postgres sh -c 'until pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do sleep 1; done'
    
    # Run Prisma migrations
    log_info "Running Prisma migrations..."
    docker-compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" npm run prisma:migrate
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    docker-compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" npm run prisma:generate
    
    log_success "Database setup completed!"
}

# Run migrations
migrate_database() {
    log_info "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" npm run prisma:migrate
    log_success "Migrations completed!"
}

# Seed database
seed_database() {
    log_info "Seeding database with sample data..."
    docker-compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" npm run db:seed
    log_success "Database seeded successfully!"
}

# Health check
health_check() {
    log_info "Checking health of spare-parts-service..."
    
    local health_url="http://localhost:4006/health"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$health_url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "200" ]]; then
        log_success "Spare-parts-service is healthy!"
        curl -s "$health_url" | jq '.' 2>/dev/null || echo "Service responded with HTTP 200"
    else
        log_error "Spare-parts-service is not healthy (HTTP $response)"
        exit 1
    fi
}

# Clean up
clean_up() {
    log_warning "This will stop and remove all containers and volumes. Are you sure? (y/N)"
    read -r confirmation
    
    if [[ "$confirmation" =~ ^[Yy]$ ]]; then
        log_info "Cleaning up containers and volumes..."
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
        docker system prune -f
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Development mode
dev_mode() {
    log_info "Starting in development mode..."
    load_env
    export NODE_ENV=development
    docker-compose -f "$COMPOSE_FILE" up -d
    show_logs "-f"
}

# Production mode
prod_mode() {
    log_info "Starting in production mode..."
    load_env
    export NODE_ENV=production
    docker-compose -f "$COMPOSE_FILE" -f "$SCRIPT_DIR/docker-compose.prod.yml" up -d
    log_success "Production services started!"
}

# Main script logic
main() {
    case "${1:-}" in
        "start")
            start_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "build")
            build_services
            ;;
        "rebuild")
            rebuild_services
            ;;
        "status")
            show_status
            ;;
        "logs")
            shift
            show_logs "$@"
            ;;
        "shell")
            open_shell
            ;;
        "db-setup")
            setup_database
            ;;
        "db-migrate")
            migrate_database
            ;;
        "db-seed")
            seed_database
            ;;
        "health")
            health_check
            ;;
        "clean")
            clean_up
            ;;
        "dev")
            dev_mode
            ;;
        "prod")
            prod_mode
            ;;
        "-h"|"--help"|"help")
            show_usage
            ;;
        "")
            log_error "No command specified."
            show_usage
            exit 1
            ;;
        *)
            log_error "Unknown command: $1"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
