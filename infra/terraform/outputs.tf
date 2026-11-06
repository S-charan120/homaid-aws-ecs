output "application_url" {
  value = var.domain_name != "" ? "http://${var.domain_name}" : "http://${aws_lb.app.dns_name}"
}
output "alb_dns_name" { value = aws_lb.app.dns_name }
output "ecs_cluster_name" { value = aws_ecs_cluster.main.name }
output "ecs_api_service_name" { value = aws_ecs_service.api.name }
output "ecs_web_service_name" { value = aws_ecs_service.web.name }
output "ecr_api_repository_name" { value = aws_ecr_repository.api.name }
output "ecr_web_repository_name" { value = aws_ecr_repository.web.name }
output "github_actions_role_arn" { value = aws_iam_role.github_actions.arn }
output "mongodb_secret_arn" { value = aws_secretsmanager_secret.mongodb.arn }
output "admin_token_secret_arn" { value = aws_secretsmanager_secret.admin.arn }
output "nat_gateway_public_ip" { value = aws_eip.nat.public_ip }
