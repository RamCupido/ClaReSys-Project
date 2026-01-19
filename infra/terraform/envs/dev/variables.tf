variable "aws_region" { type = string }
variable "project_name" { type = string }
variable "env" { type = string }

variable "allowed_ssh_cidr" { type = string }
variable "public_key_openssh" { type = string }

variable "ami_id" { type = string }
variable "instance_type_bastion" { type = string }
variable "instance_type_app" { type = string }
variable "instance_type_infra" { type = string }

variable "app_asg_desired" { type = number }
variable "app_asg_min" { type = number }
variable "app_asg_max" { type = number }

variable "repo_url" { type = string }
variable "repo_branch" { type = string }
variable "compose_app_path" { type = string }
variable "compose_infra_path" { type = string }
