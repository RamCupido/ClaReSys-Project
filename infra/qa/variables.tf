variable "region"   { 
  type = string
  default = "us-east-1" 
}

variable "ami_id"   { 
  type = string
  default = "ami-076732ef6da62445f" 
}

variable "key_name" { 
  type = string
  default = "qa_key_pair" 
}
variable "my_ip_cidr" { 
  type = string
  default = "190.155.255.65/32" 
}

variable "enable_edge"     { 
  type = bool
  default = true 
}
variable "enable_classroom" { 
  type = bool
  default = true
}

# Images
variable "edge_image"      { 
  type = string
  default = "augusto573/api-gateway:latest" 
}
variable "classroom_image" { 
  type = string
  default = "augusto573/classroom-service:latest" 
}
variable "classroom_db_image" { 
  type = string
  default = "augusto573/classroom-db:qa" 
}

# DB env (classroom)
variable "db_user" { 
  type = string
  default = "admin" 
}
variable "db_password" { 
  type = string
  default = "password123" 
}
variable "classroom_db_name" { 
  type = string
  default = "classroom_db" 
}

# Kafka env (classroom)
variable "kafka_topic_audit" { 
  type = string
  default = "audit.logs" 
}

# Instance types (academy friendly)
variable "edge_instance_type" { 
  type = string
  default = "t3.micro" 
}

variable "classroom_instance_type" { 
  type = string
  default = "t3.small"
}

# Identity
variable "enable_identity" { 
  type = bool 
  default = true 
}

variable "identity_instance_type" { 
  type = string 
  default = "t3.small" 
}

variable "auth_image" { 
  type = string 
  default = "augusto573/auth-service:latest" 
}
variable "user_image" { 
  type = string 
  default = "augusto573/user-service:latest" 
}
variable "users_db_image" { 
  type = string 
  default = "augusto573/users-db:qa" 
}

variable "users_db_name" { 
  type = string 
  default = "users_db" 
}

variable "enable_booking" { 
  type = bool 
  default = true 
}
variable "booking_instance_type" { 
  type = string 
  default = "t3.small" 
}

variable "booking_db_image" { 
  type = string 
  default = "augusto573/booking-db:qa" 
}
variable "booking_command_image" { 
  type = string 
  default = "augusto573/booking-command:latest" 
}
variable "booking_query_image" { 
  type = string 
  default = "augusto573/booking-query:latest" 
}
variable "timetable_image" { 
  type = string 
  default = "augusto573/timetable-engine:latest" 
}

variable "internal_api_key" { 
  type = string 
  default = "CHANGE_ME_INTERNAL" 
}
variable "secret_key" { 
  type = string 
  default = "super_secret_for_dev" 
}
