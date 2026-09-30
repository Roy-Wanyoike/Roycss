# RoyCSS — Terraform for Google Cloud (Cloud Run + Cloud SQL + Memorystore).
#
# Provisions the production target infrastructure for the Go backend:
#   - Cloud SQL PostgreSQL 16 instance + database
#   - Memorystore Redis 7 instance
#   - Cloud Run service for the API (from backend-go/Dockerfile)
#   - Cloud Run service for the worker (same image, CMD override)
#   - Secret Manager secrets for JWT signing (access + refresh)
#
# IMAGE PROVENANCE — reconciled with .github/workflows/deploy.yml (issue #266):
#   deploy.yml is the ACTIVE deployment path (Railway CLI for the backend +
#   Vercel for the frontend) and it builds NO container image. This
#   Terraform is the GCP ALTERNATIVE path, and NOTHING builds the image
#   for it: the operator must build + push it before `terraform apply`, e.g.
#
#     docker build -f backend-go/Dockerfile -t <REGISTRY>/roycss-api:TAG backend-go/
#     docker push <REGISTRY>/roycss-api:TAG
#
#   then pass the real ref via -var image=<REGISTRY>/roycss-api:TAG. The
#   `image` variable ships a clearly-marked PLACEHOLDER default so
#   `terraform plan` succeeds without lying — the placeholder is not a
#   real artifact and MUST be overridden before apply (a future CI
#   workflow may take over this build; see issue #138 for the
#   deploy-platform decision).
#
# Usage:
#   cd infrastructure/terraform
#   terraform init
#   terraform plan -var project_id=your-project -var region=us-central1 -var image=<REGISTRY>/roycss-api:TAG
#   terraform apply -var project_id=your-project -var region=us-central1 -var image=<REGISTRY>/roycss-api:TAG

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

variable "image" {
  type    = string
  default = "gcr.io/PROJECT_ID/roycss-api:BUILD_AND_PUSH_ME"
  description = "Container image for the API + worker. deploy.yml (Railway + Vercel) does NOT build it — build backend-go/Dockerfile, push to a registry, and pass the real ref, e.g. -var image=us-docker.pkg.dev/PROJECT/repo/roycss-api:TAG (issue #266). The default is a PLACEHOLDER so plan does not lie about an artifact nobody built."
}

# ─── Derived wiring (issue #266) ─────────────────────────────────────
# DATABASE_URL uses the Cloud SQL unix-socket host form required on
# Cloud Run: `?host=/cloudsql/<PROJECT>:<REGION>:<INSTANCE>` tells the Go
# pg driver to dial the Cloud SQL Auth Proxy socket that the
# run.googleapis.com/cloudsql-instances annotation (wired on BOTH Cloud
# Run services below) mounts into the container. The bare
# `postgres://roycss:<pw>@/roycss` form this replaces had no host at all
# and could never reach the database.
locals {
  cloudsql_instance = google_sql_database_instance.roycss.connection_name
  database_url      = "postgres://roycss:${random_password.db_password.result}@/${google_sql_database.roycss.name}?host=/cloudsql/${local.cloudsql_instance}"
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

# JWT_REFRESH_SECRET is an INDEPENDENT secret (issue #266): refresh
# tokens must be signed with a different key than access tokens
# (backend-node/README.md "Must differ from JWT_SECRET"), enforced at
# boot by both env validators (backend-node/src/config/env.ts and
# backend-go/pkg/config/config.go).
resource "google_secret_manager_secret" "jwt_refresh_secret" {
  secret_id = "roycss-jwt-refresh-secret"
  project   = var.project_id
  replication {
    auto { disable_on_destroy = false }
  }
  depends_on = [google_project_service.apis]
}

resource "google_secret_manager_secret_version" "jwt_refresh_secret" {
  secret      = google_secret_manager_secret.jwt_refresh_secret.id
  secret_data = random_password.jwt_refresh_secret.result
}

resource "random_password" "jwt_refresh_secret" {
  length  = 64
  special = false
}

# ─── Cloud Run — API ────────────────────────────────────────────────
resource "google_cloud_run_service" "api" {
  name     = "roycss-api"
  location = var.region

  template {
    metadata {
      annotations = {
        # Mounts the Cloud SQL Auth Proxy socket that the
        # `?host=/cloudsql/…` DATABASE_URL dials (issue #266).
        # OPERATOR PREREQUISITE (issue #290): the Cloud Run runtime service
        # account needs `roles/cloudsql.client` on the Cloud SQL instance —
        # Terraform does not grant IAM bindings here.
        "run.googleapis.com/cloudsql-instances" = local.cloudsql_instance
      }
    }
    spec {
      containers {
        image = var.image
        ports {
          container_port = 4000
        }
        env { name = "DATABASE_URL", value = local.database_url }
        env { name = "REDIS_URL",    value = "redis://${google_redis_instance.roycss.host}:${google_redis_instance.roycss.port}" }
        env {
          name = "JWT_SECRET"
          value_from { secret_ref { name = google_secret_manager_secret.jwt_secret.secret_id } }
        }
        env {
          name = "JWT_REFRESH_SECRET"
          value_from { secret_ref { name = google_secret_manager_secret.jwt_refresh_secret.secret_id } }
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
    metadata {
      annotations = {
        # The worker talks to Postgres too — same Cloud SQL socket (issue #266).
        "run.googleapis.com/cloudsql-instances" = local.cloudsql_instance
      }
    }
    spec {
      containers {
        image   = var.image
        command = ["/app/worker"]
        env { name = "REDIS_URL",    value = "redis://${google_redis_instance.roycss.host}:${google_redis_instance.roycss.port}" }
        env { name = "DATABASE_URL", value = local.database_url }
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
