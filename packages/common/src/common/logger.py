import logging
import sys

def get_logger(name: str) -> logging.Logger:
    """
    Crea un logger estandarizado para todos los microservicios.
    """
    logger = logging.getLogger(name)
    
    # Si ya tiene handlers, no agregamos más para evitar logs duplicados
    if logger.handlers:
        return logger
        
    logger.setLevel(logging.DEBUG)
    
    # Formato: [HORA] [NIVEL] [SERVICIO] Mensaje
    formatter = logging.Formatter(
        fmt="[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # Salida a la consola (stdout), vital para que Docker capture los logs
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    logger.addHandler(console_handler)
    
    return logger