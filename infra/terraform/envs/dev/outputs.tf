output "bastion_eip" {
  value = aws_eip.bastion.public_ip
}

output "alb_dns_name" {
  value = aws_lb.alb.dns_name
}

output "infra_private_ip" {
  value = aws_instance.infra.private_ip
}

output "vpc_id" { value = aws_vpc.this.id }
output "public_subnet_id" { value = aws_subnet.public_a.id }
output "private_subnet_id" { value = aws_subnet.private.id }
