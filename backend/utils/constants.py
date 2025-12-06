import os
from pydantic import BaseModel
from typing import List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "sample_data")

CURRENT_FILE = {
    "filepath": None,
    "dsid": None, 
    "data": None
}

def full_filepath(filename):
    print("utils/constants.py: full_filepath()")
    print(f"filename: {filename}")
    
    # Replace underscores with spaces if the file doesn't exist with underscores
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        # Try replacing underscores with spaces
        filename_with_spaces = filename.replace('_', ' ')
        filepath = os.path.join(DATA_DIR, filename_with_spaces)
        
    print(f"Constructed filepath: {filepath}")
    print(f"File exists: {os.path.exists(filepath)}")

    return filepath

def get_cached_file(filepath, signal_idx=None):
    print("utils/constants.py: get_cached_file()")
    print(f"filepath: {filepath}")
    print(f"signal_idx: {signal_idx}")

    if CURRENT_FILE["filepath"] == filepath and CURRENT_FILE["data"] is not None:
        if signal_idx is not None:
            return CURRENT_FILE["data"][signal_idx]
        return CURRENT_FILE["data"]
    print("No cached file found")
    return None

class DatasetRead(BaseModel):
    """
    Request model for listing Datasets for "Select File"
    
    Attributes:
        dsid: the dataset's unique_id
        dataset_name: dataset's dataset_name
        creation_time: dataset's creation_time
    """
    dsid: str
    datasetName: str
    creationTime: str