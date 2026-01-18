aws_region = "us-east-1"
project_name = "claresys"
env = "dev"

allowed_ssh_cidr = "190.155.255.65/32"
public_key_openssh = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIy4Tqws7CmV9icAVAeQ2jKMq/MWM7FJenB5MbUZgRin arriofrio@uce.edu.ec"

ami_id = "ami-003353f329df5558d"
instance_type_bastion = "t3.micro"
instance_type_app = "t3.micro"
instance_type_infra = "t3.micro"

app_asg_desired = 2
app_asg_min = 2
app_asg_max = 4

repo_url = "https://github.com/RamCupido/ClaReSys-Project"
repo_branch = "features"
compose_app_path = "infra/compose/docker-compose.app.prod.yml"
compose_infra_path = "infra/compose/docker-compose.infra.prod.yml"
