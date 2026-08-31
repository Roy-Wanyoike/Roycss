# RoyCSS — Terraform for Google Cloud (Cloud Run + Cloud SQL + Memorystore).
#
# Provisions the production target infrastructure for the Go backend:
#   - Cloud SQL PostgreSQL 16 instance + database
#   - Memorystore Redis 7 instance
#   - Cloud Run service for the API (from backend-go/Dockerfile)
#   - Cloud Run service for the worker (same image, CMD override)
#   - Secret Manager secret for JWT signing
#
# Usage:
#   cd infrastructure/terraform
#   terraform init
#   terraform plan -var project_id=your-project -var region=us-central1 -var api_image=gcr.io/PROJECT/roycss-api
#   terraform apply -var project_id=your-project -var region=us-central1 -var api_image=gcr.io/PROJECT/roycss-api
#
# The container image is built + pushed by GitHub Actions (see
# .github/workflows/deploy.yml); Terraform only provisions the infra.

variable "project_id" {
  type    = string
  default = "roycss-prod"
}

variable "region" {
  type    = string
  default = "us-central1"
}

variable "db_name" {
  type    = string
  default = "roycss"
}

variable "db_tier" {
  type    = string
  default = "db-custom-1-3840"
}

variable "redis_tier" {
  type    = string
  default = "BASIC"
}

variable "redis_size" {
  type    = number
  default = 1
}

variable "api_image" {
  type        = string
  description = "Container image for the API + worker (e.g. gcr.io/PROJECT/roycss-api)"
}

# ─── Enable required APIs ─────────────────────────────────────────────
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "redis.googleapis.com",
    "secretmanager.googleapis.com",
  ])
  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# ─── Cloud SQL PostgreSQL ────────────────────────────────────────────
resource "google_sql_database_instance" "roycss" {
  name             = "roycss-${var.region}"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"

    backup_configuration {
      enabled    = true
      start_time = "03:00"
    }
  }

  deletion_protection = true
  depends_on          = [google_project_service.apis]
}

resource "google_sql_database" "roycss" {
  name     = var.db_name
  instance = google_sql_database_instance.roycss.name
}

resource "google_sql_user" "roycss" {
  name     = "roycss"
  instance = google_sql_database_instance.roycss.name
  password = random_password.db_password.result
}

resource "random_password" "db_password" {
  length  = 32
  special = true
}

# ─── Memorystore Redis ───────────────────────────────────────────────
resource "google_redis_instance" "roycss" {
  name           = "roycss-${var.region}"
  tier           = var.redis_tier
  memory_size_gb = var.redis_size
  region         = var.region
  redis_version  = "REDIS_7_0"
  depends_on     = [google_project_service.apis]
}

# ─── Secret Manager ─────────────────────────────────────────────────
resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "roycss-jwt-secret"
  project   = var.project_id
  replication {
    auto { disable_on_destroy = false }
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt_secret.result
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = false
}

# ─── Cloud Run — API ────────────────────────────────────────────────
resource "google_cloud_run_service" "api" {
  name     = "roycss-api"
  location = var.region

  template {
    spec {
      containers {
        image = var.api_image
        ports {
          container_port = 4000
        }
        env { name = "DATABASE_URL", value = "postgres://roycss:${random_password.db_password.result}@/${google_sql_database.roycss.name}" }
        env { name = "REDIS_URL",    value = "redis://${google_redis_instance.roycss.host}:${google_redis_instance.roycss.port}" }
        env {
          name = "JWT_SECRET"
          value_from { secret_ref { name = google_secret_manager_secret.jwt_secret.secret_id } }
        }
        env {
          name = "JWT_REFRESH_SECRET"
          value_from { secret_ref { name = google_secret_manager_secret.jwt_secret.secret_id } }
        }
        env { name = "NODE_ENV", value = "production" }
        env { name = "PORT",     value = "4000" }
        resources {
          limits = { cpu = "1", memory = "512Mi" }
        }
      }
    }
    autoscaling {
      min_instance_count = 1
      max_instance_count = 10
    }
  }

  traffic { percent = 100, latest_revision = true }
  depends_on = [google_project_service.apis]
}

# ─── Cloud Run — Worker ─────────────────────────────────────────────
resource "google_cloud_run_service" "worker" {
  name     = "roycss-worker"
  location = var.region

  template {
    spec {
      containers {
        image   = var.api_image
        command = ["/app/worker"]
        env { name = "REDIS_URL",    value = "redis://${google_redis_instance.roycss.host}:${google_redis_instance.roycss.port}" }
        env { name = "DATABASE_URL", value = "postgres://roycss:${random_password.db_password.result}@/${google_sql_database.roycss.name}" }
        resources {
          limits = { cpu = "1", memory = "512Mi" }
        }
      }
    }
    autoscaling {
      min_instance_count = 1
      max_instance_count = 5
    }
  }

  depends_on = [google_cloud_run_service.api]
}

# ─── IAM — allow unauthenticated invokers on the API ─────────────────
resource "google_cloud_run_service_iam_member" "api_public" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ─── Outputs ────────────────────────────────────────────────────────
output "api_url"              { value = google_cloud_run_service.api.status[0].url }
output "worker_url"           { value = google_cloud_run_service.worker.status[0].url }
output "db_connection_name"   { value = google_sql_database_instance.roycss.connection_name }
output "redis_host"           { value = google_redis_instance.roycss.host }
