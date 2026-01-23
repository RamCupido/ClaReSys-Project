output "alb_dns_name" {
  value = aws_lb.qa.dns_name
}

output "edge_private_ip" {
  value = try(aws_instance.edge[0].private_ip, null)
}

output "classroom_private_ip" {
  value = try(aws_instance.classroom[0].private_ip, null)
}
