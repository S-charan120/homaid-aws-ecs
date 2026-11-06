# Cost and teardown notes

This is not a free-tier guarantee. Actual charges depend on region, task sizes, desired count, traffic, log volume, data transfer, NAT usage and AWS pricing at deployment time.

## Cost drivers
- Application Load Balancer: hourly and capacity-unit charges.
- NAT Gateway: hourly and per-GB processing charges; the sample uses one NAT Gateway to reduce fixed cost, but it is not AZ-resilient.
- ECS Fargate: CPU/memory billed while tasks run; default desired counts are two API and two web tasks.
- ECR: image storage and transfer.
- CloudWatch: log ingestion, retention and alarms.
- Secrets Manager: per-secret and API request charges.
- Route 53: hosted zone and DNS query charges where applicable.
- MongoDB Atlas: separate provider charges; not included in AWS.

Before apply, use the AWS Pricing Calculator for your region and selected settings. Set an AWS Budget/alert. For a learning environment, reduce desired task counts and destroy infrastructure when not in use. Destroying may remove ALB, ECS services, NAT and networking; preserve data and Terraform state intentionally.
