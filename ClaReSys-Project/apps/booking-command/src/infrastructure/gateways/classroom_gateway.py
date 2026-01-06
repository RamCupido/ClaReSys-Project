import os
import requests
from uuid import UUID
from src.domain.ports import ClassroomGateway

class HttpClassroomGateway(ClassroomGateway):
    def __init__(self):
        # En Docker, el nombre del servicio es el hostname
        self.base_url = os.getenv("CLASSROOM_SERVICE_URL", "http://classroom-service:8000")

    def exists(self, classroom_id: UUID) -> bool:
        try:
            # GET /api/v1/classrooms/{id} (asumiendo que implementaremos este endpoint)
            # Por ahora validamos contra la lista general o un endpoint específico si existiera
            # Para simplificar, usaremos el endpoint de lista filtrando (o idealmente uno de detalle)
            url = f"{self.base_url}/api/v1/classrooms/"
            response = requests.get(url)
            
            if response.status_code != 200:
                print(f"Error conectando a Classroom Service: {response.status_code}")
                return False
                
            data = response.json()
            # Buscamos si el ID existe en la respuesta (ineficiente en prod, útil para lab)
            # En producción: GET /api/v1/classrooms/{id}
            for classroom in data:
                if classroom.get("id") == str(classroom_id):
                    return True
            return False
            
        except Exception as e:
            print(f"Excepción en ClassroomGateway: {e}")
            return False