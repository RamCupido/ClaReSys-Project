variable "project" {}
variable "environment" {}
variable "subnets" {}
variable "app_sg_id" {}
variable "target_group_arn" {}

resource "aws_launch_template" "qa_lt" {
  name_prefix   = "${var.project}-${var.environment}-lt-"
  image_id      = "ami-076732ef6da62445f"
  instance_type = "t3.micro"

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [var.app_sg_id]
  }

  user_data = base64encode(<<EOF
#!/bin/bash
yum update -y
amazon-linux-extras install docker -y
service docker start
systemctl enable docker

# Aquí se clonaría el monorepo o se copiaría el build QA
EOF
  )
}

resource "aws_autoscaling_group" "qa_asg" {
  min_size         = 1
  max_size         = 2
  desired_capacity = 1
  vpc_zone_identifier = var.subnets
  target_group_arns  = [var.target_group_arn]

  launch_template {
    id      = aws_launch_template.qa_lt.id
    version = "$Latest"
  }
}
