variable "project" {}
variable "environment" {}
variable "subnets" {}
variable "db_sg_id" {}

resource "aws_instance" "postgres" {
  ami           = "ami-076732ef6da62445f"
  instance_type = "t3.micro"
  subnet_id     = var.subnets[0]
  vpc_security_group_ids = [var.db_sg_id]

  tags = {
    Name = "${var.project}-${var.environment}-postgres"
  }
}

resource "aws_instance" "mongo" {
  ami           = "ami-076732ef6da62445f"
  instance_type = "t3.micro"
  subnet_id     = var.subnets[0]
  vpc_security_group_ids = [var.db_sg_id]

  tags = {
    Name = "${var.project}-${var.environment}-mongo"
  }
}

resource "aws_instance" "redis" {
  ami           = "ami-076732ef6da62445f"
  instance_type = "t3.micro"
  subnet_id     = var.subnets[0]
  vpc_security_group_ids = [var.db_sg_id]

  tags = {
    Name = "${var.project}-${var.environment}-redis"
  }
}
