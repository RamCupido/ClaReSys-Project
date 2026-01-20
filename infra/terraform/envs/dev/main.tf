terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name_prefix = "${var.project_name}-${var.env}"
  tags = {
    Project = var.project_name
    Env     = var.env
  }
}

# --- Networking (2 public subnets for ALB + 1 private subnet) ---
resource "aws_vpc" "this" {
  cidr_block           = "10.30.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.this.id
  tags = merge(local.tags, { Name = "${local.name_prefix}-igw" })
}

# Public subnets (ALB requires at least 2 subnets in 2 different AZs)
resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.30.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}a"
  tags = merge(local.tags, { Name = "${local.name_prefix}-public-a" })
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.this.id
  cidr_block              = "10.30.3.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "${var.aws_region}b"
  tags = merge(local.tags, { Name = "${local.name_prefix}-public-b" })
}

# Private subnet (kept as single subnet, as per your initial design)
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.this.id
  cidr_block        = "10.30.2.0/24"
  availability_zone = "${var.aws_region}a"
  tags = merge(local.tags, { Name = "${local.name_prefix}-private" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags = merge(local.tags, { Name = "${local.name_prefix}-rt-public" })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.igw.id
}

resource "aws_route_table_association" "public_assoc_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_assoc_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# NAT Gateway (in a public subnet)
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = merge(local.tags, { Name = "${local.name_prefix}-nat-eip" })
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_a.id
  tags = merge(local.tags, { Name = "${local.name_prefix}-nat" })
  depends_on = [aws_internet_gateway.igw]
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id
  tags = merge(local.tags, { Name = "${local.name_prefix}-rt-private" })
}

resource "aws_route" "private_nat" {
  route_table_id         = aws_route_table.private.id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.nat.id
}

resource "aws_route_table_association" "private_assoc" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# --- Key Pair ---
resource "aws_key_pair" "main" {
  key_name   = "${local.name_prefix}-key"
  public_key = var.public_key_openssh
  tags = local.tags
}

# --- Security Groups ---
resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-sg-alb"
  description = "ALB public"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "bastion" {
  name        = "${local.name_prefix}-sg-bastion"
  description = "Bastion"
  vpc_id      = aws_vpc.this.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "app" {
  name        = "${local.name_prefix}-sg-app"
  description = "ASG app nodes"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "SSH from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_security_group" "infra" {
  name        = "${local.name_prefix}-sg-infra"
  description = "DB/MW node"
  vpc_id      = aws_vpc.this.id

  ingress {
    description     = "SSH from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    description     = "Postgres from app nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "Mongo from app nodes"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "Redis from app nodes"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "RabbitMQ from app nodes"
    from_port       = 5672
    to_port         = 5672
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  ingress {
    description     = "Kafka from app nodes"
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

# --- Bastion EC2 + EIP ---
resource "aws_instance" "bastion" {
  ami                         = var.ami_id
  instance_type               = var.instance_type_bastion
  subnet_id                   = aws_subnet.public_a.id
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  key_name                    = aws_key_pair.main.key_name
  associate_public_ip_address = true

  tags = merge(local.tags, { Name = "${local.name_prefix}-bastion" })
}

resource "aws_eip" "bastion" {
  domain = "vpc"
  tags = merge(local.tags, { Name = "${local.name_prefix}-bastion-eip" })
}

resource "aws_eip_association" "bastion" {
  instance_id   = aws_instance.bastion.id
  allocation_id = aws_eip.bastion.id
}

# --- Infra EC2 (private) ---
data "template_file" "infra_user_data" {
  template = file("${path.module}/user_data_infra.sh.tpl")
  vars = {
    REPO_BRANCH       = var.repo_branch
    COMPOSE_INFRA_PATH = var.compose_infra_path
  }
}

resource "aws_instance" "infra" {
  ami                    = var.ami_id
  instance_type          = var.instance_type_infra
  subnet_id              = aws_subnet.private.id
  vpc_security_group_ids = [aws_security_group.infra.id]
  key_name               = aws_key_pair.main.key_name

  user_data = data.template_file.infra_user_data.rendered

  tags = merge(local.tags, { Name = "${local.name_prefix}-infra" })
}

# --- ALB + TG + Listener ---
resource "aws_lb" "alb" {
  name               = "${local.name_prefix}-alb"
  load_balancer_type = "application"
  subnets            = [aws_subnet.public_a.id, aws_subnet.public_b.id]
  security_groups    = [aws_security_group.alb.id]
  tags = local.tags
}

resource "aws_lb_target_group" "app_tg" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.this.id

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 15
    matcher             = "200"
  }

  tags = local.tags
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
}

# --- Launch Template + ASG (App Nodes) ---
data "template_file" "app_user_data" {
  template = file("${path.module}/user_data_app.sh.tpl")
  vars = {
    INFRA_PRIVATE_IP  = aws_instance.infra.private_ip
    REPO_BRANCH       = var.repo_branch
    COMPOSE_APP_PATH  = var.compose_app_path
  }
}

resource "aws_launch_template" "app" {
  name_prefix   = "${local.name_prefix}-lt-"
  image_id      = var.ami_id
  instance_type = var.instance_type_app
  key_name      = aws_key_pair.main.key_name

  vpc_security_group_ids = [aws_security_group.app.id]

  user_data = base64encode(data.template_file.app_user_data.rendered)

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.tags, { Name = "${local.name_prefix}-app" })
  }
}

resource "aws_autoscaling_group" "app" {
  name                = "${local.name_prefix}-asg"
  desired_capacity    = var.app_asg_desired
  min_size            = var.app_asg_min
  max_size            = var.app_asg_max
  vpc_zone_identifier = [aws_subnet.private.id]

  target_group_arns = [aws_lb_target_group.app_tg.arn]
  health_check_type = "ELB"

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }

  tag {
    key                 = "Env"
    value               = var.env
    propagate_at_launch = true
  }
}
