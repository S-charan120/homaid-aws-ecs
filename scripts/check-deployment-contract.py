#!/usr/bin/env python3
"""Guard the AWS deployment contract across Terraform, GitHub Actions and Nginx."""

from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def variable_default(source: str, name: str) -> str:
    match = re.search(
        rf'variable\s+"{re.escape(name)}"\s*\{{(?P<body>.*?)\n\}}',
        source,
        flags=re.DOTALL,
    )
    if not match:
        raise AssertionError(f"Terraform variable {name!r} is missing")
    default = re.search(r'^\s*default\s*=\s*"([^"]*)"\s*$', match.group("body"), re.MULTILINE)
    if not default:
        raise AssertionError(f"Terraform variable {name!r} must have a string default")
    return default.group(1)


def main() -> None:
    variables = read("infra/terraform/variables.tf")
    main_tf = read("infra/terraform/main.tf")
    oidc_tf = read("infra/terraform/github-actions.tf")
    workflow = read(".github/workflows/ci.yml")
    compute = read("infra/terraform/compute.tf")
    compose = read("docker-compose.yml")
    dockerfile = read("web/Dockerfile")
    ecs_nginx = read("web/nginx.conf")
    compose_nginx = read("web/nginx-compose.conf")
    deployment = read("docs/deployment.md")
    architecture = read("docs/architecture.md")
    readme = read("README.md")
    outputs = read("infra/terraform/outputs.tf")
    runbook = read("docs/runbook.md")

    owner, repository = variable_default(variables, "github_repository").split("/", maxsplit=1)
    owner_id = variable_default(variables, "github_repository_owner_id")
    repository_id = variable_default(variables, "github_repository_id")
    environment = variable_default(variables, "github_actions_environment")
    expected_subject = (
        f"repo:{owner}@{owner_id}/{repository}@{repository_id}:environment:{environment}"
    )
    assert "github_oidc_subject =" in main_tf, "Terraform must construct the OIDC subject"
    assert '"token.actions.githubusercontent.com:sub" = local.github_oidc_subject' in oidc_tf, (
        "IAM trust must use the computed subject"
    )
    assert 'output "github_oidc_subject"' in read("infra/terraform/outputs.tf"), (
        "the exact subject must be exposed for operator verification"
    )
    assert f"environment: {environment}" in workflow, (
        "the workflow environment must match the Terraform OIDC environment"
    )
    assert "github.event_name == 'workflow_dispatch'" in workflow, (
        "manual deployment from main must be explicitly allowed"
    )
    assert "github.ref == 'refs/heads/main'" in workflow, (
        "deployments must remain restricted to main"
    )
    assert expected_subject in deployment, (
        f"deployment guide must document the computed immutable subject: {expected_subject}"
    )
    assert "aws-production" in deployment and "main" in deployment, (
        "deployment guide must document the environment and main-branch restriction"
    )

    web_service_start = compute.index('resource "aws_ecs_service" "web" {')
    following_resource = compute.find("\nresource ", web_service_start + 1)
    web_service = compute[web_service_start:] if following_resource < 0 else compute[web_service_start:following_resource]
    assert "deployment_circuit_breaker" in web_service, (
        "the web ECS service must enable deployment circuit-breaker rollback"
    )
    api_service_start = compute.index('resource "aws_ecs_service" "api" {')
    api_end = compute.find("\nresource ", api_service_start + 1)
    api_service = compute[api_service_start:] if api_end < 0 else compute[api_service_start:api_end]
    assert "deployment_circuit_breaker" in api_service, (
        "the API ECS service must retain deployment circuit-breaker rollback"
    )
    assert "both ECS services" in architecture.lower() or "api and web services" in architecture.lower(), (
        "architecture guide must describe rollback protection for both services"
    )
    assert "both api and web services" in readme.lower(), (
        "README must describe rollback protection for both services"
    )

    assert re.search(r"location\s*=\s*/health\s*\{[^}]*return\s+200", ecs_nginx), (
        "ECS web health must respond locally without resolving the API service"
    )
    assert "proxy_pass" not in ecs_nginx, (
        "ECS Nginx must not depend on a Compose-only API hostname"
    )
    assert "proxy_pass http://api:8081/api/" in compose_nginx, (
        "local Compose Nginx must retain the API reverse proxy"
    )
    assert "NGINX_CONFIG: nginx-compose.conf" in compose, (
        "Compose must select its service-DNS-aware Nginx configuration"
    )
    assert "ARG NGINX_CONFIG=nginx.conf" in dockerfile and "RUN nginx -t" in dockerfile, (
        "the Docker build must validate its selected Nginx configuration"
    )
    assert "terraform apply tfplan" in deployment, (
        "the deployment guide must include application of the reviewed Terraform plan"
    )

    print(
        "AWS deployment contract passed: immutable OIDC/environment scope, main-only push/dispatch, "
        "ECS rollback on both services, independent ECS web health, Compose API proxy and apply runbook."
    )


if __name__ == "__main__":
    main()
