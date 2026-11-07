locals {
  name = "${var.project_name}-${var.environment}"
  tags = merge({
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }, var.tags)
  azs             = slice(data.aws_availability_zones.available.names, 0, 2)
  github_oidc_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : var.github_oidc_provider_arn
}
