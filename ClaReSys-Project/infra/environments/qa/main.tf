module "network" {
  source = "../../modules/network"
}

module "security" {
  source      = "../../modules/security"
  project     = var.project
  environment = var.environment
  vpc_id      = module.network.aws_vpc_id
}

module "alb" {
  source      = "../../modules/alb"
  project     = var.project
  environment = var.environment
  vpc_id      = module.network.aws_vpc_id
  subnets     = module.network.aws_subnets_ids
  alb_sg_id   = module.security.alb_sg_id
}

module "compute" {
  source             = "../../modules/compute-qa"
  project            = var.project
  environment        = var.environment
  subnets            = module.network.aws_subnets_ids
  app_sg_id          = module.security.app_sg_id
  target_group_arn   = module.alb.target_group_arn
}

module "databases" {
  source      = "../../modules/databases"
  project     = var.project
  environment = var.environment
  subnets     = module.network.aws_subnets_ids
  db_sg_id    = module.security.db_sg_id
}
