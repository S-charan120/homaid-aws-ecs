variable "aws_region" {
  type    = string
  default = "ap-south-1"
}
variable "project_name" {
  type    = string
  default = "homaid"
}
variable "environment" {
  type    = string
  default = "production"
}
variable "vpc_cidr" {
  type    = string
  default = "10.40.0.0/16"
}
variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.40.0.0/24", "10.40.1.0/24"]
}
variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.40.10.0/24", "10.40.11.0/24"]
}
variable "desired_count" {
  type    = number
  default = 2
  validation {
    condition     = var.desired_count >= 1 && var.desired_count <= 10
    error_message = "desired_count must be between 1 and 10."
  }
}
variable "task_cpu" {
  type    = number
  default = 512
}
variable "task_memory" {
  type    = number
  default = 1024
}
variable "github_repository" {
  type    = string
  default = "S-charan120/homaid-aws-ecs"
}
variable "github_oidc_provider_arn" {
  type        = string
  default     = ""
  description = "Existing GitHub OIDC provider ARN. Reuse the provider if it already exists in the AWS account."
}
variable "create_github_oidc_provider" {
  type    = bool
  default = true
}
variable "mongodb_uri_secret_name" {
  type    = string
  default = "homaid/production/mongodb-uri"
}
variable "admin_api_token_secret_name" {
  type    = string
  default = "homaid/production/admin-api-token"
}
variable "domain_name" {
  type        = string
  default     = ""
  description = "Optional Route 53 record. Configure ACM and HTTPS before using a real production domain."
}
variable "hosted_zone_id" {
  type    = string
  default = ""
}
variable "tags" {
  type    = map(string)
  default = {}
}
