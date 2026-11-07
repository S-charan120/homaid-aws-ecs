# Operations runbook

## Check service health
- ECS: inspect desired/running task counts and recent deployment events for both services.
- ALB: inspect target-group health for API `/ready` and web `/health`.
- CloudWatch: use the Terraform outputs so custom project/environment names remain correct:

  ```bash
  aws logs tail "$(terraform -chdir=infra/terraform output -raw api_log_group_name)" --since 1h
  aws logs tail "$(terraform -chdir=infra/terraform output -raw web_log_group_name)" --since 1h
  ```
- MongoDB: confirm Atlas availability, TLS connection and database-user permissions.

## Common symptoms
| Symptom | First checks |
|---|---|
| ALB 503 | Target groups, ECS tasks, container health checks, ALB-to-task security-group rules |
| API readiness 503 | MongoDB URI secret, Atlas allowlist, DNS, TLS and database availability |
| Tasks restart | ECS stopped reason, CloudWatch logs, memory/CPU and secret injection |
| Booking returns 400 | Required fields, supported service ID, valid email/address and future scheduled time |
| Booking lookup 404 | Correct booking ID and original one-time booking token |
| Status update 401 | Admin token secret and request header |
| Status transition 409 | Current state; only documented forward transitions are accepted |

## Rollback
Use a previous known-good ECR SHA image tag. Register a task-definition revision with both API and web container images set to the desired SHA, update the ECS services, wait for stability and confirm target health. Record the old and new task-definition ARNs.
