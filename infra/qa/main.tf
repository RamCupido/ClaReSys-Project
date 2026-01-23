terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

provider "aws" { 
  region = var.region
}

data "aws_vpc" "default" { 
  default = true
}

data "aws_subnets" "default_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "availability-zone"
    values = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
  }
}

locals {
  subnet_ids = slice(data.aws_subnets.default_subnets.ids, 0, 2)
}

# -------------------------
# Security Groups
# -------------------------
resource "aws_security_group" "alb" {
  name   = "qa-alb-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port = 80
    to_port = 80
    protocol = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress  {
    from_port = 0 
    to_port = 0 
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"] 
  }
}

resource "aws_security_group" "edge" {
  name   = "qa-edge-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "classroom" {
  name   = "qa-classroom-sg"
  vpc_id = data.aws_vpc.default.id

  # Solo EDGE puede llamar al classroom por HTTP
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.edge.id]
  }
  
  # BOOKING -> CLASSROOM (llamadas internas)
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.booking.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "identity" {
  name   = "qa-identity-sg"
  vpc_id = data.aws_vpc.default.id

  # HTTP solo desde EDGE
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.edge.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress { 
    from_port = 0 
    to_port = 0 
    protocol = "-1" 
    cidr_blocks = ["0.0.0.0/0"] 
  }
}

resource "aws_security_group" "booking" {
  name   = "qa-booking-sg"
  vpc_id = data.aws_vpc.default.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.edge.id]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip_cidr]
  }

  egress { 
    from_port = 0 
    to_port = 0 
    protocol = "-1" 
    cidr_blocks = ["0.0.0.0/0"] 
  }
}

# -------------------------
# EC2: Classroom (backend real)
# -------------------------
resource "aws_instance" "classroom" {
  count                  = var.enable_classroom ? 1 : 0
  ami                    = var.ami_id
  instance_type          = var.classroom_instance_type
  subnet_id              = local.subnet_ids[0]
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.classroom.id]

  user_data = templatefile("${path.module}/userdata/classroom.sh", {
    classroom_image     = var.classroom_image
    classroom_db_image  = var.classroom_db_image
    db_user             = var.db_user
    db_password         = var.db_password
    classroom_db_name   = var.classroom_db_name
    kafka_topic_audit   = var.kafka_topic_audit
  })

  tags = { Name = "qa-classroom" }
}

resource "aws_instance" "identity" {
  count                  = var.enable_identity ? 1 : 0
  ami                    = var.ami_id
  instance_type          = var.identity_instance_type
  subnet_id              = local.subnet_ids[0]
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.identity.id]

  user_data = templatefile("${path.module}/userdata/identity.sh", {
    users_db_image = var.users_db_image
    auth_image     = var.auth_image
    user_image     = var.user_image

    db_user        = var.db_user
    db_password    = var.db_password
    users_db_name  = var.users_db_name
  })

  tags = { Name = "qa-identity" }
}

resource "aws_instance" "booking" {
  count                  = var.enable_booking ? 1 : 0
  ami                    = var.ami_id
  instance_type          = var.booking_instance_type
  subnet_id              = local.subnet_ids[0]
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.booking.id]

  user_data = templatefile("${path.module}/userdata/booking.sh", {
    booking_db_image       = var.booking_db_image
    booking_command_image  = var.booking_command_image
    booking_query_image    = var.booking_query_image
    timetable_image        = var.timetable_image

    db_user                = var.db_user
    db_password            = var.db_password
    booking_db_name        = "booking_db"

    internal_api_key       = var.internal_api_key
    secret_key             = var.secret_key

    classroom_private_ip   = aws_instance.classroom[0].private_ip
  })

  depends_on = [aws_instance.classroom]

  tags = { Name = "qa-booking" }
}

# -------------------------
# EC2: Edge (API Gateway Nginx)
# -------------------------
resource "aws_instance" "edge" {
  count                  = var.enable_edge ? 1 : 0
  ami                    = var.ami_id
  instance_type          = var.edge_instance_type
  subnet_id              = local.subnet_ids[1]
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.edge.id]

  user_data = templatefile("${path.module}/userdata/edge.sh", {
    edge_image          = var.edge_image
    classroom_private_ip = var.enable_classroom ? aws_instance.classroom[0].private_ip : ""
    identity_private_ip  = var.enable_identity ? aws_instance.identity[0].private_ip : ""
    booking_private_ip = var.enable_booking ? aws_instance.booking[0].private_ip : ""
  })

  depends_on = [aws_instance.classroom]
  tags = { Name = "qa-edge" }
}

# -------------------------
# ALB -> EDGE
# -------------------------
resource "aws_lb" "qa" {
  name               = "qa-claresys-alb"
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = local.subnet_ids
}

resource "aws_lb_target_group" "edge" {
  name     = "qa-edge-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = data.aws_vpc.default.id

  health_check {
    path                = "/health"
    matcher             = "200"
    interval            = 15
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.qa.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.edge.arn
  }
}

resource "aws_lb_target_group_attachment" "edge_attach" {
  target_group_arn = aws_lb_target_group.edge.arn
  target_id        = aws_instance.edge[0].id
  port             = 80
}
