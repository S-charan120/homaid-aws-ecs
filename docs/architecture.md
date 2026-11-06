# Architecture

## Request path
1. A browser resolves the optional Route 53 alias to the public Application Load Balancer.
2. The ALB forwards `/api/*` requests to the API target group on TCP 8081.
3. Other paths go to the React/Nginx target group on TCP 80.
4. Nginx serves the built React application. The API connects to MongoDB Atlas using a URI injected from AWS Secrets Manager.
5. ECS sends container logs to CloudWatch Logs. Container Insights and ALB metrics provide operational signals.

## Network boundaries
- ALB subnets are public in two Availability Zones.
- ECS tasks run in private subnets and do not receive public IP addresses.
- A single NAT Gateway provides task egress to MongoDB Atlas and package endpoints. This lowers fixed cost but creates an AZ dependency.
- The task security group accepts web/API ports only from the ALB security group.
- The ALB exposes HTTP in the learning baseline. Configure ACM and an HTTPS listener before using a real production domain.

## Delivery path
A push to `main` runs validation. Once AWS repository variables are configured, GitHub Actions assumes the repository-scoped IAM role through OIDC, builds and pushes SHA-tagged images to ECR, registers task-definition revisions with those immutable image tags, updates both ECS services and waits for stability.
