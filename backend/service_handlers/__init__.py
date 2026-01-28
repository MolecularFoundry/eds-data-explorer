from .file_service import FileService
from .signal_service import SignalService
from .data_service import DataService
from pycrucible import CrucibleClient
import os
from dotenv import load_dotenv

load_dotenv()

print("\n=== Initializing Services ===")

# Create instances of our services
crucible_client = CrucibleClient(api_url="https://crucible.lbl.gov/testapi", api_key = os.getenv("CRUCIBLE_API_KEY"))
file_service = FileService(crucible_client)
signal_service = SignalService(file_service, crucible_client)
data_service = DataService(file_service, crucible_client)

print("FileService initialized")
print("SignalService initialized")
print("=== Services Initialization Complete ===\n")

# Export the service instances
__all__ = ['file_service', 'signal_service', 'data_service'] 