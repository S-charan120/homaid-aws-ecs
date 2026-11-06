# Security controls and remaining production work

## Implemented baseline
- ECS tasks run in private subnets and only accept traffic from the ALB security group.
- GitHub Actions uses OIDC rather than long-lived AWS access keys.
- IAM execution role reads only the two Homaid Secrets Manager secrets and writes container logs.
- API applies Helmet, rate limits, strict JSON parsing, request validation and a small body-size limit.
- Booking access tokens are generated once, returned once and stored as SHA-256 hashes; the raw token is not stored.
- Admin status updates require a separate token compared with a timing-safe comparison.
- MongoDB access uses an application connection string in Secrets Manager, not source control.

## Before production
- Add ACM TLS termination and redirect HTTP to HTTPS.
- Use a private MongoDB connectivity option where feasible; otherwise tightly scope Atlas network access to the NAT egress IP.
- Configure remote Terraform state with encryption, locking and least-privilege access.
- Enable dependency/image scanning, secret scanning and patch automation.
- Set ALB deletion protection, ECS deployment circuit breakers and WAF according to threat model.
- Review CloudWatch retention, alarm notification targets and incident ownership.
- Validate backup/restore and MongoDB recovery procedures.
