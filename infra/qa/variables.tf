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

variable "enable_ops" { 
  type = bool 
  default = true 
}
variable "ops_instance_type" { 
  type = string 
  default = "t3.small" 
}

variable "audit_image" { 
  type = string 
  default = "augusto573/audit-log-service:latest" 
}
variable "maintenance_image" { 
  type = string 
  default = "augusto573/maintenance-service:latest" 
}
variable "reporting_image" { 
  type = string 
  default = "augusto573/reporting-service:latest" 
}
variable "notification_image" { 
  type = string 
  default = "augusto573/notification-service:latest" 
}
variable "mqtt_bridge_image" { 
  type = string 
  default = "augusto573/mqtt-bridge:latest" 
}

# Mongo
variable "mongo_user" { 
  type = string 
  default = "admin" 
}
variable "mongo_password" { 
  type = string 
  default = "secure1234" 
}
variable "mongo_db" { 
  type = string 
  default = "claresys" 
}

# RabbitMQ
variable "rabbit_user" { 
  type = string 
  default = "guest" 
}
variable "rabbit_password" { 
  type = string 
  default = "guest" 
}
variable "rabbit_exchange_domain" { 
  type = string 
  default = "domain.events" 
}

# Reporting base URLs (apuntarán a IPs privadas de tus instancias ya creadas)
variable "request_timeout_seconds" { 
  type = string 
  default = "10" 
}

# Notification (NO pongas valores aquí si vas a commitear; usa terraform.tfvars local)
variable "smtp_host" { 
  type = string 
  default = "smtp.gmail.com" 
}
variable "smtp_port" { 
  type = string 
  default = "587" 
}
variable "smtp_user" { 
  type = string 
}
variable "smtp_password" { 
  type = string 
}
variable "from_email" { 
  type = string 
}
variable "from_name" { 
  type = string 
  default = "ClaReSys Notificaciones" 
}

# MQTT (si usas anonymous true, no necesitas user/pass)
variable "mqtt_topic_prefix" { 
  type = string 
  default = "claresys" 
}
