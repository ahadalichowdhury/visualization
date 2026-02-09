package export

import (
	"fmt"
	"strings"
)

// NodeConfig represents a simplified node configuration for export
type NodeConfig struct {
	ID           string
	Type         string
	Label        string
	InstanceType string
	Region       string
	Config       map[string]interface{}
}

// Edge represents a connection between nodes
type Edge struct {
	Source string
	Target string
}

// TerraformExporter generates Terraform HCL code
type TerraformExporter struct {
	nodes []NodeConfig
	edges []Edge
}

// NewTerraformExporter creates a new Terraform exporter
func NewTerraformExporter(nodes []NodeConfig, edges []Edge) *TerraformExporter {
	return &TerraformExporter{
		nodes: nodes,
		edges: edges,
	}
}

// Generate generates the complete Terraform configuration
func (e *TerraformExporter) Generate() string {
	var output strings.Builder

	// Terraform version and provider configuration
	output.WriteString(e.generateProvider())
	output.WriteString("\n")

	// Generate resources for each node
	for _, node := range e.nodes {
		resource := e.generateResource(node)
		if resource != "" {
			output.WriteString(resource)
			output.WriteString("\n")
		}
	}

	// Generate variables
	output.WriteString(e.generateVariables())

	// Generate outputs
	output.WriteString(e.generateOutputs())

	return output.String()
}

// generateProvider generates the Terraform provider configuration
func (e *TerraformExporter) generateProvider() string {
	return `terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
`
}

// generateResource generates Terraform resource for a node
func (e *TerraformExporter) generateResource(node NodeConfig) string {
	resourceName := sanitizeName(node.Label)
	
	switch node.Type {
	case "api_server", "web_server", "microservice":
		return e.generateEC2Instance(node, resourceName)
	case "load_balancer":
		return e.generateALB(node, resourceName)
	case "database_sql":
		return e.generateRDS(node, resourceName)
	case "database_nosql":
		return e.generateDynamoDB(node, resourceName)
	case "cache_redis":
		return e.generateElastiCache(node, resourceName)
	case "object_storage":
		return e.generateS3(node, resourceName)
	case "queue":
		return e.generateSQS(node, resourceName)
	case "api_gateway":
		return e.generateAPIGateway(node, resourceName)
	case "cdn":
		return e.generateCloudFront(node, resourceName)
	case "lambda":
		return e.generateLambda(node, resourceName)
	default:
		return fmt.Sprintf("# Unsupported resource type: %s (%s)\n", node.Type, node.Label)
	}
}

// generateEC2Instance generates EC2 instance resource
func (e *TerraformExporter) generateEC2Instance(node NodeConfig, name string) string {
	instanceType := getInstanceType(node)
	
	return fmt.Sprintf(`resource "aws_instance" "%s" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = "%s"
  
  tags = {
    Name        = "%s"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

`, name, instanceType, node.Label)
}

// generateALB generates Application Load Balancer
func (e *TerraformExporter) generateALB(node NodeConfig, name string) string {
	return fmt.Sprintf(`resource "aws_lb" "%s" {
  name               = "%s"
  internal           = false
  load_balancer_type = "application"
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

resource "aws_lb_target_group" "%s_tg" {
  name     = "%s-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

resource "aws_lb_listener" "%s_listener" {
  load_balancer_arn = aws_lb.%s.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.%s_tg.arn
  }
}

`, name, name, node.Label, name, name, name, name, name)
}

// generateRDS generates RDS database instance
func (e *TerraformExporter) generateRDS(node NodeConfig, name string) string {
	instanceClass := getRDSInstanceClass(node)
	
	return fmt.Sprintf(`resource "aws_db_instance" "%s" {
  identifier           = "%s"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "%s"
  allocated_storage    = 20
  storage_type         = "gp3"
  
  db_name  = "mydb"
  username = var.db_username
  password = var.db_password
  
  skip_final_snapshot = true
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

`, name, name, instanceClass, node.Label)
}

// generateDynamoDB generates DynamoDB table
func (e *TerraformExporter) generateDynamoDB(node NodeConfig, name string) string {
	return fmt.Sprintf(`resource "aws_dynamodb_table" "%s" {
  name           = "%s"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

`, name, name, node.Label)
}

// generateElastiCache generates ElastiCache Redis cluster
func (e *TerraformExporter) generateElastiCache(node NodeConfig, name string) string {
	nodeType := "cache.t3.micro"
	if val, ok := node.Config["instanceType"].(string); ok && val != "" {
		nodeType = val
	}
	
	return fmt.Sprintf(`resource "aws_elasticache_cluster" "%s" {
  cluster_id           = "%s"
  engine               = "redis"
  node_type            = "%s"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

`, name, name, nodeType, node.Label)
}

// generateS3 generates S3 bucket
func (e *TerraformExporter) generateS3(node NodeConfig, name string) string {
	return fmt.Sprintf(`resource "aws_s3_bucket" "%s" {
  bucket = "%s"
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "%s_versioning" {
  bucket = aws_s3_bucket.%s.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

`, name, name, node.Label, name, name)
}

// generateSQS generates SQS queue
func (e *TerraformExporter) generateSQS(node NodeConfig, name string) string {
	return fmt.Sprintf(`resource "aws_sqs_queue" "%s" {
  name                      = "%s"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 345600
  receive_wait_time_seconds = 0
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

`, name, name, node.Label)
}

// generateAPIGateway generates API Gateway
func (e *TerraformExporter) generateAPIGateway(node NodeConfig, name string) string {
	return fmt.Sprintf(`resource "aws_api_gateway_rest_api" "%s" {
  name        = "%s"
  description = "API Gateway for %s"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "%s_deployment" {
  rest_api_id = aws_api_gateway_rest_api.%s.id
  stage_name  = var.environment
}

`, name, name, node.Label, name, name)
}

// generateCloudFront generates CloudFront distribution
func (e *TerraformExporter) generateCloudFront(node NodeConfig, name string) string {
	return fmt.Sprintf(`resource "aws_cloudfront_distribution" "%s" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "%s"
  default_root_object = "index.html"
  
  origin {
    domain_name = aws_s3_bucket.main.bucket_regional_domain_name
    origin_id   = "S3-main"
  }
  
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-main"
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

`, name, node.Label, node.Label)
}

// generateLambda generates Lambda function
func (e *TerraformExporter) generateLambda(node NodeConfig, name string) string {
	return fmt.Sprintf(`resource "aws_lambda_function" "%s" {
  filename      = "lambda_function.zip"
  function_name = "%s"
  role          = aws_iam_role.%s_role.arn
  handler       = "index.handler"
  runtime       = "nodejs18.x"
  
  tags = {
    Name        = "%s"
    Environment = var.environment
  }
}

resource "aws_iam_role" "%s_role" {
  name = "%s-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

`, name, name, name, node.Label, name, name)
}

// generateVariables generates variable definitions
func (e *TerraformExporter) generateVariables() string {
	return `
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}
`
}

// generateOutputs generates output values
func (e *TerraformExporter) generateOutputs() string {
	var outputs strings.Builder
	
	outputs.WriteString("\n# Outputs\n")
	
	for _, node := range e.nodes {
		name := sanitizeName(node.Label)
		switch node.Type {
		case "load_balancer":
			outputs.WriteString(fmt.Sprintf(`
output "%s_dns" {
  description = "DNS name of %s"
  value       = aws_lb.%s.dns_name
}
`, name, node.Label, name))
		case "database_sql":
			outputs.WriteString(fmt.Sprintf(`
output "%s_endpoint" {
  description = "Endpoint of %s"
  value       = aws_db_instance.%s.endpoint
}
`, name, node.Label, name))
		}
	}
	
	return outputs.String()
}

// Helper functions

func sanitizeName(name string) string {
	// Remove special characters and replace spaces with underscores
	name = strings.ToLower(name)
	name = strings.ReplaceAll(name, " ", "_")
	name = strings.ReplaceAll(name, "-", "_")
	// Remove any non-alphanumeric characters except underscore
	var result strings.Builder
	for _, char := range name {
		if (char >= 'a' && char <= 'z') || (char >= '0' && char <= '9') || char == '_' {
			result.WriteRune(char)
		}
	}
	return result.String()
}

func getInstanceType(node NodeConfig) string {
	if val, ok := node.Config["instanceType"].(string); ok && val != "" {
		return val
	}
	return "t3.micro"
}

func getRDSInstanceClass(node NodeConfig) string {
	if val, ok := node.Config["instanceType"].(string); ok && val != "" {
		return val
	}
	return "db.t3.micro"
}
