variable "project" {}
variable "environment" {}
variable "subnets" {}
variable "vpc_id" {}
variable "alb_sg_id" {}

resource "aws_lb" "qa_alb" {
  name               = "${var.project}-${var.environment}-alb"
  load_balancer_type = "application"
  subnets            = var.subnets
  security_groups    = [var.alb_sg_id]
}

resource "aws_lb_target_group" "qa_tg" {
  name     = "${var.project}-${var.environment}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    path = "/health"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.qa_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.qa_tg.arn
  }
}

output "target_group_arn" {
  value       = aws_lb_target_group.qa_tg.arn
}

output "alb_dns" {
  value       = aws_lb.qa_alb.dns_name
}