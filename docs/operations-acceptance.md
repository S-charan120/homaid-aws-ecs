# Homaid operations and acceptance guide

This page is the hand-off from implementation to a controlled AWS deployment. Follow it in order; don't skip directly to Terraform apply.

## 1. Preflight

- [ ] AWS account and region are correct; budget alerts are enabled.
- [ ] Terraform state is remote, encrypted, versioned and locked (never commit local state).
- [ ] `terraform fmt -check -recursive`, `terraform init`, and `terraform validate` pass.
- [ ] Review `terraform plan`; confirm subnet, NAT, ALB, ECS, IAM and log retention choices.
- [ ] GitHub OIDC provider/role trust is restricted to this repository and intended branch/environment.
- [ ] ECR repositories exist and image tags are commit-SHA based/immutable.
- [ ] MongoDB endpoint is reachable from API task egress; credentials are in Secrets Manager.
- [ ] Admin token and DB secret values are populated without entering Git or CI logs.

## 2. First deployment sequence

1. Apply reviewed Terraform foundation.
2. Confirm ECR, ECS cluster/services, target groups, security groups and log groups exist.
3. Populate Secrets Manager values and confirm API environment names match secret injection.
4. Trigger the opt-in deployment workflow with the intended commit.
5. Verify both image digests in ECR and task-definition revisions reference those tags.
6. Wait for ECS services to become stable; verify ALB target health.
7. Smoke-test web root, API health/readiness, and one safe application flow.
8. Check CloudWatch logs and alarms; record deployment SHA, workflow URL and timestamps.

## 3. Release acceptance

A release is accepted only when API and web workflows pass; ECR contains exact SHA artifacts; ECS desired/running task counts agree and deployment is stable; ALB targets are healthy; readiness and smoke tests pass; no unexpected error spike appears; rollback revision and operator are documented.

## 4. Rollback

1. Identify last known-good ECS task-definition revision (do not rebuild old source).
2. Update service to that revision through the approved deployment workflow/CLI.
3. Wait for service stability and target health.
4. Run readiness/smoke checks and inspect logs.
5. Record incident, failed revision, rollback revision and follow-up action.

## 5. Stop and cost control

For a disposable lab, use deployment guide teardown order after exporting evidence. Confirm Terraform destroy plan carefully; preserve remote state and intended data. NAT Gateway, ALB, Fargate and logs can cost even with no user traffic.
