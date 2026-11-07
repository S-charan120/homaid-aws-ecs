# AWS deployment

## 1. Prerequisites
- An AWS account with permission to provision VPC, EC2 networking, ALB, ECS, ECR, IAM, Secrets Manager, CloudWatch and optional Route 53.
- Terraform 1.7+ and AWS provider 6.x (the configuration pins `~> 6.0`).
- MongoDB Atlas or another reachable MongoDB endpoint.
- GitHub repository admin permission to configure OIDC variables/environments.

Use a dedicated AWS learning account and set a budget. The sample creates two ECS services, ALB, NAT Gateway, ECR, logs, alarms and network resources. Review [costs](costs.md) before creating anything.

## 2. Terraform state and plan
The sample intentionally has no backend configured. For shared work, configure encrypted remote S3 state and state locking with restricted access. Do not commit `terraform.tfstate`, `.terraform/` or `terraform.tfvars`.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Set AWS region, GitHub OIDC provider and optional Route 53 values.
terraform init
terraform fmt -check -recursive
terraform validate
terraform plan -out=tfplan
terraform show tfplan
```

Review every resource and cost before applying the saved plan.

## 3. GitHub OIDC
The example defaults to creating the AWS IAM OIDC provider for `https://token.actions.githubusercontent.com`. If your AWS account already has that provider, set `create_github_oidc_provider = false` and supply its ARN in `github_oidc_provider_arn`. The Terraform role trust is restricted to `S-charan120/homaid-aws-ecs` on `refs/heads/main`. The workflow uses short-lived OIDC tokens; do not create IAM user access keys for GitHub.

Set these repository **Actions variables** after Terraform apply:

| Variable | Terraform output / value |
|---|---|
| `AWS_ROLE_TO_ASSUME` | `github_actions_role_arn` |
| `AWS_REGION` | Same region as Terraform |
| `ECR_API_REPOSITORY` | `ecr_api_repository_name` |
| `ECR_WEB_REPOSITORY` | `ecr_web_repository_name` |
| `ECS_CLUSTER` | `ecs_cluster_name` |
| `ECS_API_SERVICE` | `ecs_api_service_name` |
| `ECS_WEB_SERVICE` | `ecs_web_service_name` |

The deploy job remains skipped until `AWS_ROLE_TO_ASSUME` is set. Pull requests run validation only.

## 4. MongoDB and secrets
Terraform creates empty secret containers. After apply, populate both:

```bash
aws secretsmanager put-secret-value --secret-id "$(terraform output -raw mongodb_secret_arn)" --secret-string 'mongodb+srv://USER:PASSWORD@CLUSTER.example.mongodb.net/homaid?retryWrites=true&w=majority'
aws secretsmanager put-secret-value --secret-id "$(terraform output -raw admin_token_secret_arn)" --secret-string "$(openssl rand -hex 32)"
```

Allowlist the NAT Gateway public IP from `terraform output -raw nat_gateway_public_ip` in Atlas, or use private connectivity where available. Use a dedicated database user with least privilege, and confirm TLS is enabled.

## 5. First deployment
Terraform creates ECS services and task definitions using a `bootstrap` image tag so the service resources can be provisioned before the first CI release. The bootstrap tag is not a deployable image: the initial service tasks remain unhealthy until a real commit-SHA image is published and the deployment workflow registers task-definition revisions. Populate runtime secrets and repository variables, then push a validated commit to `main`. GitHub Actions tests the API, builds the frontend and images, pushes commit-SHA tags, registers new task-definition revisions using those immutable tags, updates the services and waits for stability.

Check ALB target health and CloudWatch logs. If tasks fail before secrets are populated, they will not become healthy.

## 6. Route 53
Optionally set `domain_name` and `hosted_zone_id` in `terraform.tfvars` to create an ALB alias record. The sample listener is HTTP-only; do not use it for a real production domain until an ACM certificate, HTTPS listener and HTTP-to-HTTPS redirect are configured.

## 7. CI dependency reproducibility
The repository commits `api/package-lock.json` and `web/package-lock.json`. GitHub Actions installs from these lockfiles with `npm ci`; CI does not auto-commit dependency updates. Update dependencies deliberately in a reviewed commit (`npm install` in the relevant package directory), inspect the lockfile diff, then run the full validation workflow.

## 8. Rollback
Choose a previous commit-SHA image tag from ECR, register new API/web task-definition revisions that point to those images, update the two ECS services and wait for stability. Record the prior task-definition ARNs and validate both ALB target groups.
