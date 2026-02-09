package export

import (
	"encoding/json"
	"fmt"
)

// CloudFormationExporter generates AWS CloudFormation templates
type CloudFormationExporter struct {
	nodes []NodeConfig
	edges []Edge
}

// NewCloudFormationExporter creates a new CloudFormation exporter
func NewCloudFormationExporter(nodes []NodeConfig, edges []Edge) *CloudFormationExporter {
	return &CloudFormationExporter{
		nodes: nodes,
		edges: edges,
	}
}

// CloudFormationTemplate represents a CloudFormation template structure
type CloudFormationTemplate struct {
	AWSTemplateFormatVersion string                            `json:"AWSTemplateFormatVersion"`
	Description              string                            `json:"Description"`
	Parameters               map[string]CFParameter            `json:"Parameters,omitempty"`
	Resources                map[string]CFResource             `json:"Resources"`
	Outputs                  map[string]CFOutput               `json:"Outputs,omitempty"`
}

type CFParameter struct {
	Type        string `json:"Type"`
	Description string `json:"Description,omitempty"`
	Default     string `json:"Default,omitempty"`
	NoEcho      bool   `json:"NoEcho,omitempty"`
}

type CFResource struct {
	Type       string                 `json:"Type"`
	Properties map[string]interface{} `json:"Properties"`
	DependsOn  []string               `json:"DependsOn,omitempty"`
}

type CFOutput struct {
	Description string      `json:"Description"`
	Value       interface{} `json:"Value"`
}

// Generate generates the complete CloudFormation template as JSON
func (e *CloudFormationExporter) Generate() (string, error) {
	template := CloudFormationTemplate{
		AWSTemplateFormatVersion: "2010-09-09",
		Description:              "Infrastructure stack generated from architecture visualization",
		Parameters:               e.generateParameters(),
		Resources:                e.generateResources(),
		Outputs:                  e.generateOutputs(),
	}

	jsonBytes, err := json.MarshalIndent(template, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal CloudFormation template: %w", err)
	}

	return string(jsonBytes), nil
}

// generateParameters generates CloudFormation parameters
func (e *CloudFormationExporter) generateParameters() map[string]CFParameter {
	params := make(map[string]CFParameter)

	params["Environment"] = CFParameter{
		Type:        "String",
		Description: "Environment name",
		Default:     "production",
	}

	// Check if we have RDS databases
	for _, node := range e.nodes {
		if node.Type == "database_sql" {
			params["DBUsername"] = CFParameter{
				Type:        "String",
				Description: "Database master username",
				Default:     "admin",
			}
			params["DBPassword"] = CFParameter{
				Type:        "String",
				Description: "Database master password",
				NoEcho:      true,
			}
			break
		}
	}

	return params
}

// generateResources generates all CloudFormation resources
func (e *CloudFormationExporter) generateResources() map[string]CFResource {
	resources := make(map[string]CFResource)

	// Add VPC and networking (required for most resources)
	resources["VPC"] = e.createVPC()
	resources["InternetGateway"] = e.createInternetGateway()
	resources["AttachGateway"] = e.createGatewayAttachment()
	resources["PublicSubnet1"] = e.createSubnet("10.0.1.0/24", "us-east-1a")
	resources["PublicSubnet2"] = e.createSubnet("10.0.2.0/24", "us-east-1b")
	resources["RouteTable"] = e.createRouteTable()
	resources["Route"] = e.createRoute()
	resources["SubnetRouteTableAssociation1"] = e.createSubnetRouteTableAssociation("PublicSubnet1")
	resources["SubnetRouteTableAssociation2"] = e.createSubnetRouteTableAssociation("PublicSubnet2")

	// Generate resources for each node
	for _, node := range e.nodes {
		resourceName := sanitizeName(node.Label)
		resource := e.createResourceForNode(node, resourceName)
		if resource != nil {
			resources[resourceName] = *resource
		}
	}

	return resources
}

// createResourceForNode creates appropriate CloudFormation resource for a node
func (e *CloudFormationExporter) createResourceForNode(node NodeConfig, name string) *CFResource {
	switch node.Type {
	case "api_server", "web_server", "microservice":
		return e.createEC2Instance(node, name)
	case "load_balancer":
		return e.createLoadBalancer(node, name)
	case "database_sql":
		return e.createRDSInstance(node, name)
	case "database_nosql":
		return e.createDynamoDBTable(node, name)
	case "cache_redis":
		return e.createElastiCacheCluster(node, name)
	case "object_storage":
		return e.createS3Bucket(node, name)
	case "queue":
		return e.createSQSQueue(node, name)
	case "lambda":
		return e.createLambdaFunction(node, name)
	default:
		return nil
	}
}

// VPC and Networking resources

func (e *CloudFormationExporter) createVPC() CFResource {
	return CFResource{
		Type: "AWS::EC2::VPC",
		Properties: map[string]interface{}{
			"CidrBlock":         "10.0.0.0/16",
			"EnableDnsHostnames": true,
			"EnableDnsSupport":   true,
			"Tags": []map[string]string{
				{"Key": "Name", "Value": "MainVPC"},
			},
		},
	}
}

func (e *CloudFormationExporter) createInternetGateway() CFResource {
	return CFResource{
		Type: "AWS::EC2::InternetGateway",
		Properties: map[string]interface{}{
			"Tags": []map[string]string{
				{"Key": "Name", "Value": "MainIGW"},
			},
		},
	}
}

func (e *CloudFormationExporter) createGatewayAttachment() CFResource {
	return CFResource{
		Type: "AWS::EC2::VPCGatewayAttachment",
		Properties: map[string]interface{}{
			"VpcId":             map[string]string{"Ref": "VPC"},
			"InternetGatewayId": map[string]string{"Ref": "InternetGateway"},
		},
	}
}

func (e *CloudFormationExporter) createSubnet(cidr, az string) CFResource {
	return CFResource{
		Type: "AWS::EC2::Subnet",
		Properties: map[string]interface{}{
			"VpcId":                map[string]string{"Ref": "VPC"},
			"CidrBlock":            cidr,
			"AvailabilityZone":     az,
			"MapPublicIpOnLaunch": true,
		},
	}
}

func (e *CloudFormationExporter) createRouteTable() CFResource {
	return CFResource{
		Type: "AWS::EC2::RouteTable",
		Properties: map[string]interface{}{
			"VpcId": map[string]string{"Ref": "VPC"},
		},
	}
}

func (e *CloudFormationExporter) createRoute() CFResource {
	return CFResource{
		Type: "AWS::EC2::Route",
		Properties: map[string]interface{}{
			"RouteTableId":         map[string]string{"Ref": "RouteTable"},
			"DestinationCidrBlock": "0.0.0.0/0",
			"GatewayId":            map[string]string{"Ref": "InternetGateway"},
		},
		DependsOn: []string{"AttachGateway"},
	}
}

func (e *CloudFormationExporter) createSubnetRouteTableAssociation(subnetRef string) CFResource {
	return CFResource{
		Type: "AWS::EC2::SubnetRouteTableAssociation",
		Properties: map[string]interface{}{
			"SubnetId":     map[string]string{"Ref": subnetRef},
			"RouteTableId": map[string]string{"Ref": "RouteTable"},
		},
	}
}

// Application resources

func (e *CloudFormationExporter) createEC2Instance(node NodeConfig, name string) *CFResource {
	instanceType := getInstanceType(node)

	return &CFResource{
		Type: "AWS::EC2::Instance",
		Properties: map[string]interface{}{
			"InstanceType": instanceType,
			"ImageId":      "ami-0c55b159cbfafe1f0", // Amazon Linux 2 (update as needed)
			"SubnetId":     map[string]string{"Ref": "PublicSubnet1"},
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
				{"Key": "Environment", "Value": map[string]string{"Ref": "Environment"}},
			},
		},
	}
}

func (e *CloudFormationExporter) createLoadBalancer(node NodeConfig, name string) *CFResource {
	return &CFResource{
		Type: "AWS::ElasticLoadBalancingV2::LoadBalancer",
		Properties: map[string]interface{}{
			"Name":   name,
			"Scheme": "internet-facing",
			"Subnets": []interface{}{
				map[string]string{"Ref": "PublicSubnet1"},
				map[string]string{"Ref": "PublicSubnet2"},
			},
			"Type": "application",
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
			},
		},
	}
}

func (e *CloudFormationExporter) createRDSInstance(node NodeConfig, name string) *CFResource {
	instanceClass := getRDSInstanceClass(node)

	return &CFResource{
		Type: "AWS::RDS::DBInstance",
		Properties: map[string]interface{}{
			"DBInstanceIdentifier": name,
			"Engine":               "postgres",
			"EngineVersion":        "15.3",
			"DBInstanceClass":      instanceClass,
			"AllocatedStorage":     "20",
			"StorageType":          "gp3",
			"DBName":               "mydb",
			"MasterUsername":       map[string]string{"Ref": "DBUsername"},
			"MasterUserPassword":   map[string]string{"Ref": "DBPassword"},
			"PubliclyAccessible":   false,
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
			},
		},
	}
}

func (e *CloudFormationExporter) createDynamoDBTable(node NodeConfig, name string) *CFResource {
	return &CFResource{
		Type: "AWS::DynamoDB::Table",
		Properties: map[string]interface{}{
			"TableName":     name,
			"BillingMode":   "PAY_PER_REQUEST",
			"AttributeDefinitions": []map[string]string{
				{"AttributeName": "id", "AttributeType": "S"},
			},
			"KeySchema": []map[string]string{
				{"AttributeName": "id", "KeyType": "HASH"},
			},
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
			},
		},
	}
}

func (e *CloudFormationExporter) createElastiCacheCluster(node NodeConfig, name string) *CFResource {
	nodeType := "cache.t3.micro"
	if val, ok := node.Config["instanceType"].(string); ok && val != "" {
		nodeType = val
	}

	return &CFResource{
		Type: "AWS::ElastiCache::CacheCluster",
		Properties: map[string]interface{}{
			"ClusterName":        name,
			"Engine":             "redis",
			"CacheNodeType":      nodeType,
			"NumCacheNodes":      1,
			"Port":               6379,
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
			},
		},
	}
}

func (e *CloudFormationExporter) createS3Bucket(node NodeConfig, name string) *CFResource {
	return &CFResource{
		Type: "AWS::S3::Bucket",
		Properties: map[string]interface{}{
			"BucketName": name,
			"VersioningConfiguration": map[string]string{
				"Status": "Enabled",
			},
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
			},
		},
	}
}

func (e *CloudFormationExporter) createSQSQueue(node NodeConfig, name string) *CFResource {
	return &CFResource{
		Type: "AWS::SQS::Queue",
		Properties: map[string]interface{}{
			"QueueName":                  name,
			"MessageRetentionPeriod":     345600,
			"VisibilityTimeout":          30,
			"ReceiveMessageWaitTimeSeconds": 0,
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
			},
		},
	}
}

func (e *CloudFormationExporter) createLambdaFunction(node NodeConfig, name string) *CFResource {
	return &CFResource{
		Type: "AWS::Lambda::Function",
		Properties: map[string]interface{}{
			"FunctionName": name,
			"Runtime":      "nodejs18.x",
			"Handler":      "index.handler",
			"Role":         map[string]interface{}{"Fn::GetAtt": []string{name + "Role", "Arn"}},
			"Code": map[string]interface{}{
				"ZipFile": "exports.handler = async (event) => { return { statusCode: 200, body: 'Hello World' }; };",
			},
			"Tags": []map[string]interface{}{
				{"Key": "Name", "Value": node.Label},
			},
		},
	}
}

// generateOutputs generates CloudFormation outputs
func (e *CloudFormationExporter) generateOutputs() map[string]CFOutput {
	outputs := make(map[string]CFOutput)

	outputs["VPCId"] = CFOutput{
		Description: "VPC ID",
		Value:       map[string]string{"Ref": "VPC"},
	}

	for _, node := range e.nodes {
		name := sanitizeName(node.Label)
		switch node.Type {
		case "load_balancer":
			outputs[name+"DNS"] = CFOutput{
				Description: fmt.Sprintf("DNS name of %s", node.Label),
				Value:       map[string]interface{}{"Fn::GetAtt": []string{name, "DNSName"}},
			}
		case "database_sql":
			outputs[name+"Endpoint"] = CFOutput{
				Description: fmt.Sprintf("Endpoint of %s", node.Label),
				Value:       map[string]interface{}{"Fn::GetAtt": []string{name, "Endpoint.Address"}},
			}
		case "object_storage":
			outputs[name+"BucketName"] = CFOutput{
				Description: fmt.Sprintf("S3 bucket name for %s", node.Label),
				Value:       map[string]string{"Ref": name},
			}
		}
	}

	return outputs
}
